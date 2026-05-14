from __future__ import annotations

import ftplib
import hashlib
import json
import re
import time
from typing import Any, Callable

from app.services.cloud_protected_registry import is_cloud_protected_file
from app.services.recipe_cache_store import (
    ensure_schema,
    get_inventory_entry,
    list_inventory_entries,
    list_latest_versions,
    mark_inventory_failure,
    reconcile_inventory_entries,
    resolve_inventory_failures,
    store_file_version,
    touch_inventory_state,
)
from app.services.recipe_preview_service import build_recipe_preview_from_bytes
from app.services.recipe_vm_store import save_vm_file, list_vm_entries, read_vm_file_meta
from app.services.file_ops_service import ftp_read_bytes_at_path as svc_ftp_read_bytes_at_path

DIR_LINE_RE = re.compile(r'^\s*(\d{2}-\d{2}-\d{2})\s+(\d{2}:\d{2}[AP]M)\s+(\d+)\s+(.+?)\s*$')

MONITORED_SOURCE_CONFIG: dict[str, dict[str, Any]] = {
    'polishRecipe': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.pol']},
    'conditionRecipe': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.con']},
    'exSituCondition': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.con']},
    'specialExSitu': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.con']},
    'megasonics': {'path': r'\CMPDB\Lcmp\Recipes\CLEANER', 'exts': ['.meg']},
    'brush1': {'path': r'\CMPDB\Lcmp\Recipes\CLEANER', 'exts': ['.br']},
    'brush2': {'path': r'\CMPDB\Lcmp\Recipes\CLEANER', 'exts': ['.br']},
    'vaporDryer': {'path': r'\CMPDB\Lcmp\Recipes\CLEANER', 'exts': ['.drpr', '.dryr', '.dypr']},
}

_LIVE_PATH_CACHE_TTL_SEC = 3.0
_LIVE_PATH_CACHE: dict[tuple[str, str, str], tuple[float, list[dict[str, str]]]] = {}


def _normalize_cfg_lines(text: str) -> list[str]:
    return str(text or '').replace('\r\n', '\n').replace('\r', '\n').split('\n')


def _parse_pol_system_cfg(cfg_text: str) -> dict[str, Any]:
    platen_map = {1: {}, 2: {}, 3: {}}
    chemical_names: dict[int, str] = {}
    in_section = False

    for raw in _normalize_cfg_lines(cfg_text):
        line = str(raw or '').strip()
        if not line:
            continue
        if line.startswith('['):
            in_section = line.lower() == '[slurry system]'
            continue
        if not in_section or '=' not in line:
            continue

        key, value = [part.strip() for part in line.split('=', 1)]

        chem_match = re.match(r'^Chemical\s+([A-J])\s+Name$', key, re.IGNORECASE)
        if chem_match:
            idx = ord(chem_match.group(1).upper()) - ord('A') + 1
            chemical_names[idx] = value
            continue

        lane_match = re.match(r'^Platen\s+(\d+)\s+L(\d+)\s+Chem1$', key, re.IGNORECASE)
        if lane_match:
            platen = int(lane_match.group(1))
            lane = int(lane_match.group(2))
            chem_idx = int(float(value)) if str(value).strip() else 0
            platen_map.setdefault(platen, {})[lane] = {
                'chemIndex': chem_idx,
                'letter': chr(ord('A') + chem_idx - 1) if chem_idx > 0 else '',
                'name': chemical_names.get(chem_idx, ''),
            }
            continue

    for platen, lanes in platen_map.items():
        for lane, info in lanes.items():
            chem_idx = int(info.get('chemIndex') or 0)
            if chem_idx > 0:
                info['letter'] = chr(ord('A') + chem_idx - 1)
                info['name'] = chemical_names.get(chem_idx, info.get('name', ''))

    return {'platen': platen_map, 'chemicalNames': chemical_names}


def connect_ftp(ftp_ip: str, ftp_id: str, ftp_pw: str) -> ftplib.FTP:
    ftp = ftplib.FTP(timeout=12)
    ftp.connect(ftp_ip, 21)
    ftp.login(user=ftp_id, passwd=ftp_pw)
    return ftp


def ftp_dir_entries(ftp: ftplib.FTP) -> list[dict[str, str]]:
    lines: list[str] = []
    ftp.dir(lines.append)

    items: list[dict[str, str]] = []
    for line in lines:
        line = line.rstrip()
        m = DIR_LINE_RE.match(line)
        if m:
            name_part = m.group(4).strip()
            if name_part in ('', '.', '..'):
                continue
            items.append({
                'name': name_part,
                'modifiedAt': f'{m.group(1)} {m.group(2)}',
                'size': m.group(3),
                'rawLine': line,
            })
            continue

        parts = line.split()
        if not parts:
            continue
        name_part = parts[-1].strip()
        if name_part in ('', '.', '..'):
            continue
        items.append({'name': name_part, 'modifiedAt': '', 'size': '', 'rawLine': line})

    return items


def list_entries_at_path(ftp: ftplib.FTP, path: str) -> list[dict[str, str]]:
    ftp.cwd(path)
    return ftp_dir_entries(ftp)


def _live_path_cache_key(ftp_ip: str, ftp_id: str, source_path: str) -> tuple[str, str, str]:
    return (str(ftp_ip or '').strip(), str(ftp_id or '').strip(), str(source_path or '').replace('\\', '/').lower())


def _list_live_entries_cached(ftp_ip: str, ftp_id: str, ftp_pw: str, source_path: str) -> list[dict[str, str]]:
    key = _live_path_cache_key(ftp_ip, ftp_id, source_path)
    now = time.monotonic()

    cached = _LIVE_PATH_CACHE.get(key)
    if cached and (now - cached[0]) <= _LIVE_PATH_CACHE_TTL_SEC:
        return [dict(x) for x in cached[1]]

    ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)
    try:
        entries = list_entries_at_path(ftp, source_path)
    finally:
        try:
            ftp.quit()
        except Exception:
            try:
                ftp.close()
            except Exception:
                pass

    _LIVE_PATH_CACHE[key] = (now, [dict(x) for x in entries])
    return entries


def filter_entries_by_exts(entries: list[dict[str, str]], exts: list[str]) -> list[dict[str, str]]:
    if not exts:
        return entries
    ext_set = {str(e).lower() for e in exts}
    out: list[dict[str, str]] = []
    for row in entries:
        name = str(row.get('name') or '')
        low = name.lower()
        if any(low.endswith(ext) for ext in ext_set):
            copied = dict(row)
            copied['ext'] = '.' + low.split('.')[-1] if '.' in low else ''
            out.append(copied)
    return out


def load_pol_system_cfg_live(ftp_ip: str, ftp_id: str, ftp_pw: str) -> dict[str, Any]:
    path = r'\CMPDB\LCMP\Config'
    file_name = 'POL_System.cfg'
    try:
        data = svc_ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name)
    except Exception:
        return {}

    for enc in ('utf-8', 'cp949', 'euc-kr', 'latin1'):
        try:
            return _parse_pol_system_cfg(data.decode(enc))
        except Exception:
            continue
    return {}


def _preview_context_for(eqp_id: str, source_kind: str, recipe_name: str, ftp_ip: str, ftp_id: str, ftp_pw: str) -> dict[str, Any]:
    ctx: dict[str, Any] = {'eqpId': eqp_id}
    if recipe_name.lower().endswith('.pol') or recipe_name.lower().endswith('.con'):
        ctx['slurryConfig'] = load_pol_system_cfg_live(ftp_ip, ftp_id, ftp_pw)
    return ctx


def _protected_lookup_factory(eqp_id: str, source_path: str, source_kind: str) -> Callable[[str], bool]:
    def _lookup(name: str) -> bool:
        return is_cloud_protected_file(eqp_id, source_path, name, source_kind)  # type: ignore[arg-type]
    return _lookup


def _needs_refresh_from_live(eqp_id: str, source_path: str, name: str, modified_at: str, size: str) -> bool:
    meta = read_vm_file_meta(eqp_id, source_path, name)
    if not meta:
        return True

    prev_mod = str(meta.get('modifiedAt') or '').strip()
    prev_size = str(meta.get('size') or '').strip()

    if not modified_at or not size:
        return True

    if prev_mod != modified_at or prev_size != size:
        return True

    inv = get_inventory_entry(eqp_id, source_path, name) or {}
    live_mod = str(inv.get('lastLiveModifiedAt') or inv.get('modifiedAt') or '').strip()
    live_size = str(inv.get('lastLiveSize') or inv.get('size') or '').strip()

    if live_mod != modified_at or live_size != size:
        return True

    return False


def cache_recipe_file_from_live(
    eqp_id: str,
    ftp_ip: str,
    ftp_id: str,
    ftp_pw: str,
    source_path: str,
    source_kind: str,
    name: str,
    modified_at: str,
    size: str,
) -> None:
    data = svc_ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, source_path, name)
    protected = is_cloud_protected_file(eqp_id, source_path, name, source_kind)  # type: ignore[arg-type]
    ctx = _preview_context_for(eqp_id, source_kind, name, ftp_ip, ftp_id, ftp_pw)

    preview = build_recipe_preview_from_bytes(
        recipe_id=f'VM::{eqp_id}::{source_kind}::{name}',
        recipe_name=name,
        modified_at=modified_at,
        source_kind=source_kind,
        recipe_bytes=data,
        preview_context=ctx,
    )

    save_vm_file(
        eqp_id,
        source_path,
        name,
        data,
        modified_at=modified_at,
        size=size,
        source_kind=source_kind,
        cloud_protected=protected,
        metadata={
            'previewReady': bool(preview),
            'liveModifiedAt': modified_at,
            'liveSize': size,
        },
    )

    store_file_version(
        eqp_id,
        source_path,
        name,
        modified_at,
        size,
        data,
        preview,
        capture_reason='worker',
        metadata={
            'sourceKind': source_kind,
            'cloudProtected': protected,
            'liveModifiedAt': modified_at,
            'liveSize': size,
        },
    )


def _build_inventory_hash(payload: list[list[Any]]) -> str:
    payload = sorted(payload, key=lambda x: (str(x[0]), str(x[1]).lower(), str(x[2]), str(x[3])))
    return hashlib.sha1(json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()


def sync_equipment_inventory_once(eqp_id: str, ftp_ip: str, ftp_id: str, ftp_pw: str) -> dict[str, Any]:
    ensure_schema()

    all_payload: list[list[Any]] = []
    had_change = False
    last_error = ''

    for source_kind, cfg in MONITORED_SOURCE_CONFIG.items():
        source_path = str(cfg['path'])
        exts = list(cfg['exts'])
        protected_lookup = _protected_lookup_factory(eqp_id, source_path, source_kind)

        try:
            live_entries = filter_entries_by_exts(_list_live_entries_cached(ftp_ip, ftp_id, ftp_pw, source_path), exts)

            before_entries = list_inventory_entries(eqp_id, source_path, exts=exts, include_absent=True)
            before_map = {
                str(x.get('name') or '').strip(): (
                    str(x.get('modifiedAt') or ''),
                    str(x.get('size') or ''),
                    bool(x.get('livePresent')),
                )
                for x in before_entries
            }

            reconcile_inventory_entries(eqp_id, source_path, live_entries, protected_lookup=protected_lookup)
            resolve_inventory_failures(eqp_id, source_path)

            current_names = {str(x.get('name') or '').strip() for x in live_entries}
            for old_name, (_, _, was_live) in before_map.items():
                if was_live and old_name not in current_names:
                    had_change = True

            for entry in live_entries:
                name = str(entry.get('name') or '').strip()
                modified_at = str(entry.get('modifiedAt') or '')
                size = str(entry.get('size') or '')
                ext = str(entry.get('ext') or '')
                all_payload.append([eqp_id, source_path, name, modified_at, size, ext])

                prev = before_map.get(name)
                if prev != (modified_at, size, True):
                    had_change = True

                if _needs_refresh_from_live(eqp_id, source_path, name, modified_at, size):
                    cache_recipe_file_from_live(
                        eqp_id,
                        ftp_ip,
                        ftp_id,
                        ftp_pw,
                        source_path,
                        source_kind,
                        name,
                        modified_at,
                        size,
                    )
        except Exception as exc:
            last_error = str(exc)
            mark_inventory_failure(eqp_id, source_path, 'inventory', last_error)

    snapshot_hash = _build_inventory_hash(all_payload)
    touch_inventory_state(
        eqp_id,
        changed=had_change,
        error=last_error,
        inventory_hash=snapshot_hash,
        file_count=len(all_payload),
    )
    return {
        'eqpId': eqp_id,
        'changed': had_change,
        'inventoryHash': snapshot_hash,
        'fileCount': len(all_payload),
        'lastError': last_error,
    }


def list_cached_or_live_entries_for_source(
    eqp_id: str,
    source_path: str,
    exts: list[str],
    ftp_ip: str | None = None,
    ftp_id: str | None = None,
    ftp_pw: str | None = None,
) -> list[dict[str, Any]]:
    ensure_schema()
    merged: dict[str, dict[str, Any]] = {}

    if ftp_ip and ftp_id and ftp_pw:
        try:
            live_entries = filter_entries_by_exts(_list_live_entries_cached(ftp_ip, ftp_id, ftp_pw, source_path), exts)
            for entry in live_entries:
                name = str(entry.get('name') or '').strip()
                if not name:
                    continue
                merged[name] = {
                    'name': name,
                    'ext': str(entry.get('ext') or ''),
                    'modifiedAt': str(entry.get('modifiedAt') or ''),
                    'size': str(entry.get('size') or ''),
                    'livePresent': True,
                    'cloudProtected': is_cloud_protected_file(eqp_id, source_path, name),  # type: ignore[arg-type]
                }
        except Exception:
            pass

    for item in list_inventory_entries(eqp_id, source_path, exts=exts, include_absent=True):
        name = str(item.get('name') or '').strip()
        if not name:
            continue

        live_present = bool(item.get('livePresent'))
        retain_cached = bool(item.get('retainCached'))
        cloud_protected = bool(item.get('cloudProtected'))

        if not live_present and not retain_cached and not cloud_protected:
            continue

        merged.setdefault(
            name,
            {
                'name': name,
                'ext': str(item.get('ext') or ''),
                'modifiedAt': str(item.get('modifiedAt') or ''),
                'size': str(item.get('size') or ''),
                'livePresent': live_present,
                'cloudProtected': cloud_protected,
            },
        )

    for item in list_vm_entries(eqp_id, source_path, exts=exts):
        name = str(item.get('name') or '').strip()
        if not name:
            continue

        protected = bool(item.get('cloudProtected')) or is_cloud_protected_file(eqp_id, source_path, name)  # type: ignore[arg-type]
        if not protected:
            continue

        merged.setdefault(
            name,
            {
                'name': name,
                'ext': str(item.get('ext') or ''),
                'modifiedAt': str(item.get('modifiedAt') or ''),
                'size': str(item.get('size') or ''),
                'livePresent': False,
                'cloudProtected': True,
            },
        )

    for item in list_latest_versions(eqp_id, source_path, exts=exts):
        name = str(item.get('name') or '').strip()
        if not name:
            continue

        meta = item.get('metadata') or {}
        protected = bool(meta.get('cloudProtected')) or is_cloud_protected_file(eqp_id, source_path, name)  # type: ignore[arg-type]
        if not protected:
            continue

        merged.setdefault(
            name,
            {
                'name': name,
                'ext': str(item.get('ext') or ''),
                'modifiedAt': str(item.get('modifiedAt') or ''),
                'size': str(item.get('size') or ''),
                'livePresent': False,
                'cloudProtected': True,
            },
        )

    return sorted(merged.values(), key=lambda x: str(x.get('name') or '').lower())
