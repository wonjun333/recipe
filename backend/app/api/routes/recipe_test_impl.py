from __future__ import annotations

import ftplib
import ntpath
import os
import re
import tempfile
import time
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text

from app.config import MOCK_MODE, POSTGRES_URL
from app.services.mockup_data import MOCK_EQP_LIST, MOCK_FTP_RESULT, MOCK_SOURCE_ITEMS, get_mock_file_text
from app.services.job_parser import parse_job_text
from app.services.ftp_credentials import load_eqp_ip as db_load_eqp_ip
from app.services.file_ops_service import (
    ftp_copy_delete_with_shadow as svc_ftp_copy_delete_with_shadow,
    ftp_copy_with_shadow as svc_ftp_copy_with_shadow,
    ftp_delete_at_path as svc_ftp_delete_at_path,
    ftp_delete_with_shadow as svc_ftp_delete_with_shadow,
    ftp_file_exists_at_path as svc_ftp_file_exists_at_path,
    ftp_read_bytes_at_path as svc_ftp_read_bytes_at_path,
    ftp_read_text_at_path as svc_ftp_read_text_at_path,
    ftp_write_bytes_at_path as svc_ftp_write_bytes_at_path,
    format_ftp_error as svc_format_ftp_error,
)
from app.services.recipe_preview_service import build_recipe_preview_from_bytes, build_source_recipe_preview, create_no_preview_recipe
from app.services.temp_file_store import LOCAL_EDIT_BASE, write_local_shadow_file as svc_write_local_shadow_file
from app.services.history_service import append_history_entry, list_history_entries
from app.services.history_comment_store import get_all_comments, set_comment as set_history_comment
from app.services.recipe_inventory_sync import load_pol_system_cfg_live, list_cached_or_live_entries_for_source
from app.services.recipe_cache_store import get_latest_version, get_latest_version_bytes
from app.services.recipe_vm_store import read_vm_file_bytes as read_vm_recipe_bytes

router = APIRouter(prefix="/recipe-test", tags=["recipe-test"])

NONE_LABEL = "(None)"
SOURCE_RECIPE_PREFIX = "RCP_SRC::"
TEMP_SOURCE_RECIPE_PREFIX = "RCP_TMP::"

BOOTSTRAP_CACHE: dict[str, dict[str, Any]] = {}
CAS_CACHE: dict[tuple[str, str], dict[str, Any]] = {}
JOB_CACHE: dict[tuple[str, str], dict[str, Any]] = {}
RECIPE_CACHE: dict[tuple[str, str], dict[str, Any]] = {}
RECIPE_SOURCE_CACHE: dict[tuple[str, str], tuple[float, dict[str, Any]]] = {}
RECIPE_SOURCE_CACHE_TTL_SEC = 10.0


def _get_recipe_source_cached(cache_key: tuple[str, str]) -> dict[str, Any] | None:
    entry = RECIPE_SOURCE_CACHE.get(cache_key)
    if entry and (time.time() - entry[0]) < RECIPE_SOURCE_CACHE_TTL_SEC:
        return entry[1]
    return None

DIR_LINE_RE = re.compile(
    r"^\s*(\d{2}-\d{2}-\d{2})\s+(\d{2}:\d{2}[AP]M)\s+(\d+)\s+(.+?)\s*$"
)

INVALID_FILENAME_CHARS_RE = re.compile(r'[\\/:*?"<>|]')

def validate_ascii_target_name(name: str) -> str:
    raw = str(name or '').strip()
    if not raw:
        raise ValueError('파일 이름이 비어 있습니다.')
    if any(ord(ch) < 32 or ord(ch) > 126 for ch in raw):
        raise ValueError('파일 이름은 영문/숫자/일반 ASCII 특수문자만 사용할 수 있습니다.')
    if INVALID_FILENAME_CHARS_RE.search(raw):
        raise ValueError('\\ / : * ? " < > | 문자는 사용할 수 없습니다.')
    return raw

def now_history_ts() -> str:
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def record_history(
    action: str,
    actor_name: str,
    actor_team: str,
    from_eqp_id: str,
    to_eqp_id: str,
    item_kind: str,
    source_name: str,
    target_name: str,
    *,
    status: str = 'ok',
    reason: str = '',
    created_at: str | None = None,
    recipe_name: str = '',
    request_id: str = '',
    detail: str = '',
) -> None:
    src = str(source_name or '').strip()
    tgt = str(target_name or '').strip()
    append_history_entry(
        actorName=str(actor_name or '').strip() or 'Unknown',
        actorTeam=str(actor_team or '').strip(),
        fromEqpId=str(from_eqp_id or '').strip(),
        action=str(action or '').strip(),
        toEqpId=str(to_eqp_id or '').strip(),
        createdAt=str(created_at or '').strip() or now_history_ts(),
        itemKind=str(item_kind or '').strip(),
        sourceName=src,
        targetName=tgt,
        recipeName=str(recipe_name or '').strip() or tgt or src,
        requestId=str(request_id or '').strip(),
        status=str(status or '').strip() or 'ok',
        reason=str(reason or '').strip(),
        detail=str(detail or '').strip(),
    )


def _normalize_history_value(value: Any) -> str:
    return str(value or '').strip()


def summarize_cas_slot_changes(before_slots: list[dict[str, Any]], after_slots: list[dict[str, Any]]) -> str:
    before_map = {int(x.get('slot', 0)): _normalize_history_value(x.get('jobName')) or NONE_LABEL for x in (before_slots or [])}
    parts: list[str] = []
    for row in (after_slots or []):
        slot = int(row.get('slot', 0) or 0)
        after_name = _normalize_history_value(row.get('jobName')) or NONE_LABEL
        before_name = before_map.get(slot, NONE_LABEL)
        if before_name != after_name:
            parts.append(f'Slot {slot}: {before_name} → {after_name}')
    return '; '.join(parts[:12])


def summarize_job_changes(before_parsed: dict[str, Any], after_parsed: dict[str, Any]) -> str:
    changes: list[str] = []

    def add_change(label: str, before: Any, after: Any):
        b = _normalize_history_value(before) or NONE_LABEL
        a = _normalize_history_value(after) or NONE_LABEL
        if b != a:
            changes.append(f'{label}: {b} → {a}')

    before = ensure_job_parsed_shape(before_parsed or {})
    after = ensure_job_parsed_shape(after_parsed or {})

    add_change('Pre-Metrology Enabled', before.get('preMetrology', {}).get('enabled'), after.get('preMetrology', {}).get('enabled'))
    add_change('Pre-Metrology Recipe', before.get('preMetrology', {}).get('recipe'), after.get('preMetrology', {}).get('recipe'))
    add_change('Post-Metrology Enabled', before.get('postMetrology', {}).get('enabled'), after.get('postMetrology', {}).get('enabled'))
    add_change('Post-Metrology Recipe', before.get('postMetrology', {}).get('recipe'), after.get('postMetrology', {}).get('recipe'))
    add_change('Route to Polisher', before.get('polisher', {}).get('route'), after.get('polisher', {}).get('route'))
    add_change('Route to Cleaner', before.get('cleaner', {}).get('route'), after.get('cleaner', {}).get('route'))

    before_rows = {str(r.get('label')): r for r in (before.get('polisher', {}).get('rows') or [])}
    after_rows = {str(r.get('label')): r for r in (after.get('polisher', {}).get('rows') or [])}
    for label in sorted(set(before_rows) | set(after_rows)):
        for key, platen in (('p1','P1'),('p2','P2'),('p3','P3')):
            add_change(f'{platen} {label}', (before_rows.get(label) or {}).get(key), (after_rows.get(label) or {}).get(key))

    before_cleaner = before.get('cleaner', {}).get('rows') or []
    after_cleaner = after.get('cleaner', {}).get('rows') or []
    max_len = max(len(before_cleaner), len(after_cleaner))
    for idx in range(max_len):
        b = before_cleaner[idx] if idx < len(before_cleaner) else {}
        a = after_cleaner[idx] if idx < len(after_cleaner) else {}
        add_change(f'Cleaner Step {idx} Station', b.get('module'), a.get('module'))
        add_change(f'Cleaner Step {idx} Recipe', b.get('recipe'), a.get('recipe'))

    return '; '.join(changes[:16])


def get_existing_value_in_named_section(text_value: str, section_name: str, key: str) -> str:
    normalized = text_value.replace("\r\n", "\n").replace("\r", "\n")
    section_re = re.compile(rf"(?ms)(^\[{re.escape(section_name)}\]\s*\n)(.*?)(?=^\[|\Z)")
    match = section_re.search(normalized)
    if not match:
        return ''
    body = match.group(2)
    pattern = re.compile(rf"^\s*{re.escape(key)}\s*=\s*(.*)$", re.IGNORECASE | re.MULTILINE)
    found = pattern.search(body)
    return found.group(1).strip() if found else ''


RECIPE_SOURCE_CONFIG: dict[str, dict[str, Any]] = {
    "recipe": {
        "path": r"\CMPDB\Lcmp\Recipes",
        "exts": [],
        "titleBase": "Recipe",
    },
    "polishRecipe": {
        "path": r"\CMPDB\Lcmp\Recipes",
        "exts": [".pol"],
        "titleBase": "Polish Recipe",
    },
    "conditionRecipe": {
        "path": r"\CMPDB\Lcmp\Recipes",
        "exts": [".con"],
        "titleBase": "Condition Recipe",
    },
    "exSituCondition": {
        "path": r"\CMPDB\Lcmp\Recipes",
        "exts": [".con"],
        "titleBase": "Ex Situ Condition",
    },
    "specialExSitu": {
        "path": r"\CMPDB\Lcmp\Recipes",
        "exts": [".con"],
        "titleBase": "Special Ex Situ",
    },
    "isrmAlgorithm": {
        "path": r"\CMPDB\Endpoint",
        "exts": [".alg", ".seg"],
        "titleBase": "ISRM Algorithm",
    },
    "rtpcRecipe": {
        "path": r"\CMPDB\icmp\scx",
        "exts": [".scx"],
        "titleBase": "RTPC Recipe",
    },
    "hcluPostLoad": {
        "path": r"\CMPDB\Lcmp\Recipes",
        "exts": [".cln"],
        "titleBase": "HCLU Clean Recipe Post Load",
    },
    "hcluPreUnload": {
        "path": r"\CMPDB\Lcmp\Recipes",
        "exts": [".cln"],
        "titleBase": "HCLU Clean Recipe Pre Unload",
    },
    "megasonics": {
        "path": r"\CMPDB\Lcmp\Recipes\CLEANER",
        "exts": [".meg"],
        "titleBase": "Megasonics Recipe",
    },
    "brush1": {
        "path": r"\CMPDB\Lcmp\Recipes\CLEANER",
        "exts": [".br"],
        "titleBase": "Brush Recipe",
    },
    "brush2": {
        "path": r"\CMPDB\Lcmp\Recipes\CLEANER",
        "exts": [".br"],
        "titleBase": "Brush Recipe",
    },
    "vaporDryer": {
        "path": r"\CMPDB\Lcmp\Recipes\CLEANER",
        "exts": [".drpr", ".dryr"],
        "titleBase": "Vapor Dryer Recipe",
    },
    "metrologyRecipe": {
        "path": r"\CMPDB\Lcmp_SMEM\SMEM_NANO",
        "exts": [],
        "titleBase": "Metrology Recipe",
    },
}


class LoadRequest(BaseModel):
    line: str
    team: str
    eqpId: str


class SaveCasRequest(BaseModel):
    eqpId: str
    casId: str
    slots: list[dict[str, Any]]


class SaveJobRequest(BaseModel):
    eqpId: str
    jobId: str
    config: dict[str, Any]


class PersistCasRequest(BaseModel):
    eqpId: str
    sourceCasId: str
    targetCasId: str
    slots: list[dict[str, Any]]
    actorName: str = ''
    actorTeam: str = ''


class PersistJobRequest(BaseModel):
    eqpId: str
    sourceJobId: str
    targetJobName: str
    parsed: dict[str, Any]
    actorName: str = ''
    actorTeam: str = ''


class PersistRecipeRequest(BaseModel):
    eqpId: str
    sourceRecipeName: str
    targetRecipeName: str
    sourceKind: str = 'recipe'
    actorName: str = ''
    actorTeam: str = ''


class TransferCartItem(BaseModel):
    kind: Literal["cas", "job", "recipe"]
    name: str
    sourceEqpId: str
    sourceKind: str | None = None


class TransferRequest(BaseModel):
    items: list[TransferCartItem] = Field(default_factory=list)
    targetEqpIds: list[str] = Field(default_factory=list)
    actorName: str = ''
    actorTeam: str = ''


class RenameFileRequest(BaseModel):
    eqpId: str
    kind: Literal['cas', 'job', 'recipe']
    sourceName: str
    targetName: str
    sourceKind: str | None = None
    actorName: str = ''
    actorTeam: str = ''


class DeleteFileItem(BaseModel):
    kind: Literal['cas', 'job', 'recipe']
    name: str
    sourceKind: str | None = None


class DeleteFilesRequest(BaseModel):
    eqpId: str
    items: list[DeleteFileItem] = Field(default_factory=list)
    actorName: str = ''
    actorTeam: str = ''


def load_eqp_ip(eqp_id: str) -> tuple[str, str, str]:
    return db_load_eqp_ip(eqp_id)

def _run_eqp_master_query(engine, query: str):
    with engine.connect() as conn:
        return conn.execute(text(query)).mappings().all()


def load_eqp_master_options() -> list[dict[str, str]]:
    if MOCK_MODE:
        return sorted(MOCK_EQP_LIST, key=lambda x: (x["line"], x["team"], x["eqpId"]))

    engine = create_engine(POSTGRES_URL)

    queries = [
        """
        SELECT
            COALESCE(s.site, '') AS line,
            COALESCE(e.sdwt_name, '') AS team,
            e.eqp_id AS eqp_id,
            e.eqp_model AS model,
            e.maker_name AS maker,
            e.eqp_model_bucker AS model_group
        FROM public.eqp_info e
        INNER JOIN public.sdwt_info s
          ON e.sdwt_name = s.sdwt_name
        WHERE e.prc_group IS NOT NULL
        """,
        """
        SELECT
            COALESCE(s.site, '') AS line,
            COALESCE(e.sdwt_name, '') AS team,
            e.eqp_id AS eqp_id,
            e.eqp_model AS model,
            e.maker_name AS maker,
            e.eqp_model_bucket AS model_group
        FROM public.eqp_info e
        INNER JOIN public.sdwt_info s
          ON e.sdwt_name = s.sdwt_name
        WHERE e.prc_group IS NOT NULL
        """,
        """
        SELECT
            COALESCE(s.site, COALESCE(e.line_id::text, '')) AS line,
            COALESCE(e.sdwt_name, '') AS team,
            e.eqp_id AS eqp_id,
            e.eqp_model AS model,
            e.maker_name AS maker,
            e.eqp_model_bucker AS model_group
        FROM public.eqp_info e
        LEFT JOIN public.sdwt_info s
          ON e.sdwt_name = s.sdwt_name
        WHERE e.prc_group IS NOT NULL
        """,
        """
        SELECT
            COALESCE(s.site, COALESCE(e.line_id::text, '')) AS line,
            COALESCE(e.sdwt_name, '') AS team,
            e.eqp_id AS eqp_id,
            e.eqp_model AS model,
            e.maker_name AS maker,
            e.eqp_model_bucket AS model_group
        FROM public.eqp_info e
        LEFT JOIN public.sdwt_info s
          ON e.sdwt_name = s.sdwt_name
        WHERE e.prc_group IS NOT NULL
        """,
    ]

    rows: list[dict[str, Any]] = []
    last_error: Exception | None = None
    for query in queries:
        try:
            rows = list(_run_eqp_master_query(engine, query))
            last_error = None
            break
        except Exception as e:  # pragma: no cover - DB schema dependent
            last_error = e

    if last_error:
        raise last_error

    results: list[dict[str, str]] = []
    for row in rows:
        line = str(row.get("line", "")).strip()
        team = str(row.get("team", "")).strip()
        eqp_id = str(row.get("eqp_id", "")).strip()
        model = str(row.get("model", "")).strip()
        maker = str(row.get("maker", "")).strip()
        model_group = str(row.get("model_group", "")).strip()

        if not line or not team or not eqp_id:
            continue

        results.append({
            "line": line,
            "team": team,
            "eqpId": eqp_id,
            "model": model,
            "maker": maker,
            "modelGroup": model_group,
        })

    unique = {(x["line"], x["team"], x["eqpId"]): x for x in results}
    return sorted(unique.values(), key=lambda x: (x["line"], x["team"], x["eqpId"]))


def get_eqp_meta_map() -> dict[str, dict[str, str]]:
    return {item["eqpId"]: item for item in load_eqp_master_options()}


def ftp_dir_entries(ftp: ftplib.FTP) -> list[dict[str, str]]:
    lines: list[str] = []
    ftp.dir(lines.append)

    items: list[dict[str, str]] = []
    for line in lines:
        line = line.rstrip()
        m = DIR_LINE_RE.match(line)

        if m:
            date_part = m.group(1)
            time_part = m.group(2)
            size_part = m.group(3)
            name_part = m.group(4).strip()

            if name_part in ("", ".", ".."):
                continue

            items.append({
                "name": name_part,
                "modifiedAt": f"{date_part} {time_part}",
                "size": size_part,
                "rawLine": line,
            })
            continue

        parts = line.split()
        if not parts:
            continue

        name_part = parts[-1].strip()
        if name_part in ("", ".", ".."):
            continue

        items.append({
            "name": name_part,
            "modifiedAt": "",
            "size": "",
            "rawLine": line,
        })

    return items


def connect_ftp(ftp_ip: str, ftp_id: str, ftp_pw: str) -> ftplib.FTP:
    ftp = ftplib.FTP(timeout=12)
    ftp.connect(ftp_ip, 21)
    ftp.login(user=ftp_id, passwd=ftp_pw)
    return ftp


def list_entries_in_child(ftp: ftplib.FTP, base_path: str, child_name: str) -> list[dict[str, str]]:
    ftp.cwd(base_path)
    ftp.cwd(child_name)
    return ftp_dir_entries(ftp)


def list_entries_at_path(ftp: ftplib.FTP, path: str) -> list[dict[str, str]]:
    ftp.cwd(path)
    return ftp_dir_entries(ftp)


def pick_child_name(children: list[str], keywords: list[str]) -> str | None:
    for name in children:
        low = name.lower()
        if any(k in low for k in keywords):
            return name
    return None


def _filter_entries_by_ext(entries: list[dict[str, str]], ext: str) -> list[dict[str, str]]:
    ext_lower = ext.lower()
    return [x for x in entries if str(x.get("name", "")).lower().endswith(ext_lower)]


def filter_entries_by_exts(entries: list[dict[str, str]], exts: list[str]) -> list[dict[str, str]]:
    if not exts:
        return entries
    ext_set = {x.lower() for x in exts}
    return [x for x in entries if any(str(x.get("name", "")).lower().endswith(ext) for ext in ext_set)]


def get_ftp_file_list(ftp_ip: str, ftp_id: str, ftp_pw: str):
    if MOCK_MODE:
        return MOCK_FTP_RESULT

    try:
        ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)

        base_path = r"\CMPDB\Lcmp"
        ftp.cwd(base_path)

        children_entries = ftp_dir_entries(ftp)
        children = [x["name"] for x in children_entries]

        cas_dir = pick_child_name(children, ["cas"])
        job_dir = pick_child_name(children, ["job"])
        recipe_dir = pick_child_name(children, ["recipe", "rcp", "rec"])

        if not cas_dir:
            raise RuntimeError(f"CAS directory not found under {base_path}. children={children}")
        if not job_dir:
            raise RuntimeError(f"JOB directory not found under {base_path}. children={children}")

        cas_list = _filter_entries_by_ext(list_entries_in_child(ftp, base_path, cas_dir), ".cas")
        job_list = _filter_entries_by_ext(list_entries_in_child(ftp, base_path, job_dir), ".job")

        if recipe_dir:
            try:
                recipe_list = list_entries_in_child(ftp, base_path, recipe_dir)
            except Exception:
                recipe_list = []
        else:
            recipe_list = []

        ftp.quit()

        return {
            "cas_list": cas_list,
            "job_list": job_list,
            "recipe_list": recipe_list,
            "resolved_paths": {
                "base": base_path,
                "cas": cas_dir,
                "job": job_dir,
                "recipe": recipe_dir,
            },
            "children": children,
        }

    except Exception as e:
        raise RuntimeError(f"FTP list load failed: {e}") from e


def ftp_read_bytes_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str) -> bytes:
    return svc_ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name)

def decode_ftp_bytes(data: bytes) -> str:
    for enc in ("utf-8", "cp949", "euc-kr", "latin1"):
        try:
            return data.decode(enc)
        except Exception:
            continue
    return data.decode("utf-8", errors="replace")


def ftp_read_text_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str) -> str:
    return decode_ftp_bytes(ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name))


def recipe_colon_value(text: str, key: str, default: str = "") -> str:
    m = re.search(rf"(?m)^\s*{re.escape(key)}:\s*(.*?)\s*$", text)
    return m.group(1).strip() if m else default


def format_recipe_unit(value: str, suffix: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return NONE_LABEL
    if raw == NONE_LABEL:
        return raw
    if raw.lower().endswith(suffix.strip().lower()):
        return raw
    return f"{raw}{suffix}"


def parse_meg_recipe_preview(recipe_id: str, recipe_name: str, modified_at: str, source_kind: str, recipe_text: str) -> dict[str, Any]:
    normalized = recipe_text.replace("\r\n", "\n").replace("\r", "\n")
    step_matches = list(re.finditer(r"(?ms)^\s*Step\s+(\d+):\s*\n(.*?)(?=^\s*Step\s+\d+:|\Z)", normalized))

    rows: list[dict[str, Any]] = []
    for match in step_matches:
        index = int(match.group(1))
        block = match.group(2)
        rows.append({
            '#': index,
            'Description': recipe_colon_value(block, 'Step Comments', NONE_LABEL) or NONE_LABEL,
            'Time': format_recipe_unit(recipe_colon_value(block, 'Time', ''), ' sec'),
            'Wafer RPM': format_recipe_unit(recipe_colon_value(block, 'Wafer RPM', ''), ' rpm'),
            'Meg Power': format_recipe_unit(recipe_colon_value(block, 'Meg Power', ''), ' walts'),
        })

    if not rows:
        rows = [{
            '#': 1,
            'Description': recipe_colon_value(normalized, 'Recipe Comments', NONE_LABEL) or NONE_LABEL,
            'Time': NONE_LABEL,
            'Wafer RPM': NONE_LABEL,
            'Meg Power': NONE_LABEL,
        }]

    return {
        'recipe': {
            'id': recipe_id,
            'name': recipe_name,
            'modifiedAt': modified_at,
            'sourceKind': source_kind,
            'columns': ['#', 'Description', 'Time', 'Wafer RPM', 'Meg Power'],
            'rows': rows,
        }
    }



def _normalize_cfg_lines(text: str) -> list[str]:
    return str(text or '').replace('\r\n', '\n').replace('\r', '\n').split('\n')

def parse_pol_system_cfg(cfg_text: str) -> dict[str, Any]:
    platen_map: dict[int, dict[int, dict[str, Any]]] = {1: {}, 2: {}, 3: {}}
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
            letter = chr(ord('A') + chem_idx - 1) if chem_idx > 0 else ''
            name = chemical_names.get(chem_idx, '')
            platen_map.setdefault(platen, {})[lane] = {
                'chemIndex': chem_idx,
                'letter': letter,
                'name': name,
            }
            continue

    # second pass to backfill names after chemical names are known
    for platen, lanes in platen_map.items():
        for lane, info in lanes.items():
            chem_idx = int(info.get('chemIndex') or 0)
            if chem_idx > 0:
                info['letter'] = chr(ord('A') + chem_idx - 1)
                info['name'] = chemical_names.get(chem_idx, info.get('name', ''))

    return {'platen': platen_map, 'chemicalNames': chemical_names}

def load_pol_system_cfg(eqp_id: str) -> dict[str, Any]:
    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqp_id)
    try:
        return load_pol_system_cfg_live(ftp_ip, ftp_id, ftp_pw)
    except Exception:
        return {}

def build_source_recipe_content(eqp_id: str, recipe_id: str, source_kind: str, recipe_name: str) -> dict[str, Any]:
    config = RECIPE_SOURCE_CONFIG.get(source_kind)
    if not config:
        raise HTTPException(status_code=404, detail=f"recipe source not found: {recipe_id}")

    modified_at = find_source_recipe_modified_at(eqp_id, source_kind, recipe_name)
    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqp_id)
    path = str(config['path'])

    if source_kind == 'metrologyRecipe':
        return {
            'recipe': {
                'id': recipe_id,
                'name': recipe_name,
                'modifiedAt': modified_at,
                'sourceKind': source_kind,
                'columns': ['Key', 'Value'],
                'rows': [
                    {'Key': 'METROLOGY_RECIPE', 'Value': recipe_name},
                    {'Key': 'SOURCE_PATH', 'Value': config['path']},
                    {'Key': 'MODIFIED_AT', 'Value': modified_at},
                ],
            }
        }

    ftp_failed = False
    try:
        recipe_bytes = svc_ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, path, recipe_name)
        preview_context = {'eqpId': eqp_id}
        if recipe_name.lower().endswith('.pol') or recipe_name.lower().endswith('.con'):
            preview_context['slurryConfig'] = load_pol_system_cfg(eqp_id)
        preview = build_recipe_preview_from_bytes(recipe_id, recipe_name, modified_at, source_kind, recipe_bytes, preview_context)
        if preview:
            return preview
    except Exception:
        ftp_failed = True
        cached = get_latest_version(eqp_id, path, recipe_name)
        if cached and cached.get('preview'):
            preview = dict(cached['preview'])
            recipe = dict(preview.get('recipe') or {})
            recipe['id'] = recipe_id
            recipe['name'] = recipe_name
            recipe.setdefault('modifiedAt', modified_at)
            preview['recipe'] = recipe
            return preview
        # Stored preview is NULL – retry from raw bytes
        raw = get_latest_version_bytes(eqp_id, path, recipe_name) or read_vm_recipe_bytes(eqp_id, path, recipe_name)
        if raw:
            preview_context = {'eqpId': eqp_id}
            if recipe_name.lower().endswith('.pol') or recipe_name.lower().endswith('.con'):
                try:
                    preview_context['slurryConfig'] = load_pol_system_cfg(eqp_id)
                except Exception:
                    pass
            preview = build_recipe_preview_from_bytes(recipe_id, recipe_name, modified_at, source_kind, raw, preview_context)
            if preview:
                return preview
            if source_kind in {'megasonics', 'brush1', 'brush2', 'vaporDryer'}:
                for enc in ('utf-8', 'cp949', 'euc-kr', 'latin1'):
                    try:
                        recipe_text = raw.decode(enc)
                        preview = build_source_recipe_preview(recipe_id, recipe_name, modified_at, source_kind, recipe_text)
                        if preview:
                            return preview
                        break
                    except Exception:
                        continue

    if source_kind in {'isrmAlgorithm', 'rtpcRecipe'} or recipe_name.lower().endswith(('.alg', '.seg', '.scx')):
        return create_no_preview_recipe(recipe_id, recipe_name, modified_at, source_kind)

    if not ftp_failed:
        try:
            if source_kind in {'megasonics', 'brush1', 'brush2', 'vaporDryer'}:
                recipe_text = svc_ftp_read_text_at_path(ftp_ip, ftp_id, ftp_pw, path, recipe_name)
                preview = build_source_recipe_preview(recipe_id, recipe_name, modified_at, source_kind, recipe_text)
                if preview:
                    return preview
        except Exception:
            pass

    return {
        "recipe": {
            "id": recipe_id,
            "name": recipe_name,
            "modifiedAt": modified_at,
            "sourceKind": source_kind,
            "columns": ["Key", "Value"],
            "rows": [
                {"Key": "RECIPE_NAME", "Value": recipe_name},
                {"Key": "MODIFIED_AT", "Value": modified_at},
                {"Key": "SOURCE_KIND", "Value": source_kind},
                {"Key": "SOURCE_PATH", "Value": config["path"]},
                {"Key": "STATUS", "Value": "PLACEHOLDER_PREVIEW"},
            ],
        }
    }

def ftp_write_bytes_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str, data: bytes) -> None:
    svc_ftp_write_bytes_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name, data)

def ftp_delete_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str) -> None:
    svc_ftp_delete_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name)

def ftp_file_exists_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str) -> bool:
    return svc_ftp_file_exists_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name)

def format_ftp_error(exc: Exception) -> str:
    return svc_format_ftp_error(exc)

def ftp_copy_with_shadow(source_eqp_id: str, source_path: str, source_name: str, target_eqp_id: str, target_path: str, target_name: str) -> dict[str, Any]:
    return svc_ftp_copy_with_shadow(source_eqp_id, source_path, source_name, target_eqp_id, target_path, target_name)

def ftp_copy_delete_with_shadow(eqp_id: str, path: str, source_name: str, target_name: str) -> dict[str, Any]:
    return svc_ftp_copy_delete_with_shadow(eqp_id, path, source_name, target_name)

def ftp_delete_with_shadow(eqp_id: str, path: str, file_name: str) -> dict[str, Any]:
    return svc_ftp_delete_with_shadow(eqp_id, path, file_name)

def ftp_read_text_in_child(ftp_ip: str, ftp_id: str, ftp_pw: str, base_path: str, child_name: str, file_name: str) -> str:
    if MOCK_MODE:
        return get_mock_file_text(file_name)

    data = ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, os.path.join(base_path, child_name), file_name)
    for enc in ("utf-8", "cp949", "euc-kr", "latin1"):
        try:
            return data.decode(enc)
        except Exception:
            continue
    return data.decode("utf-8", errors="replace")



def read_metrology_source_text(ftp_ip: str, ftp_id: str, ftp_pw: str, target_path: str) -> str:
    parent_path, file_name = ntpath.split(str(target_path))
    errors: list[str] = []
    if parent_path and file_name:
        try:
            return ftp_read_text_at_path(ftp_ip, ftp_id, ftp_pw, parent_path, file_name)
        except Exception as e:
            errors.append(str(e))
    ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)
    try:
        data = b''
        candidates = [str(target_path), str(target_path).replace('\\', '/'), ntpath.basename(str(target_path))]
        if parent_path:
            try:
                ftp.cwd(parent_path)
            except Exception:
                pass
        for candidate in candidates:
            try:
                buf = BytesIO()
                ftp.retrbinary(f'RETR {candidate}', buf.write)
                data = buf.getvalue()
                if data:
                    break
            except Exception as e:
                errors.append(str(e))
                continue
        if not data:
            raise RuntimeError('; '.join(errors) or 'SMEM_NANO read failed')
        for enc in ('utf-8', 'cp949', 'euc-kr', 'latin1'):
            try:
                return data.decode(enc)
            except Exception:
                continue
        return data.decode('utf-8', errors='replace')
    except Exception as e:
        errors.append(str(e))
        raise RuntimeError('; '.join(errors) or 'SMEM_NANO read failed')
    finally:
        try:
            ftp.quit()
        except Exception:
            try:
                ftp.close()
            except Exception:
                pass


def parse_metrology_recipe_names(raw_text: str) -> list[str]:
    raw = str(raw_text or '').replace("\r", ' ').replace("\n", ' ').replace("\x00", ' ')
    segments = [seg for seg in re.split(r'(?:[ \t]{80,})', raw) if seg and seg.strip()]
    names: list[str] = []
    for seg in segments:
        tokens = [tok.strip() for tok in re.split(r'\s+', seg) if tok.strip()]
        printable = [tok for tok in tokens if tok and ' ' not in tok and len(tok) <= 128]
        if len(printable) >= 2:
            names = printable
            break
    if not names:
        names = [tok for tok in re.findall(r'[A-Za-z0-9_.\-]+', raw) if tok]

    seen: set[str] = set()
    out: list[str] = []
    for name in names:
        if name in seen:
            continue
        seen.add(name)
        out.append(name)
    return out


def get_metrology_source_entries(ftp_ip: str, ftp_id: str, ftp_pw: str) -> dict[str, Any]:
    config = RECIPE_SOURCE_CONFIG['metrologyRecipe']
    target_path = str(config['path'])
    parent_path, file_name = ntpath.split(target_path)
    modified_at = ''
    ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)
    try:
        try:
            entries = list_entries_at_path(ftp, parent_path)
            matched = next((x for x in entries if str(x.get('name', '')).strip().lower() == file_name.strip().lower()), None)
            if matched:
                modified_at = str(matched.get('modifiedAt', ''))
        except Exception:
            modified_at = ''
    finally:
        try:
            ftp.quit()
        except Exception:
            try:
                ftp.close()
            except Exception:
                pass

    raw_text = read_metrology_source_text(ftp_ip, ftp_id, ftp_pw, target_path)
    items = [
        {'name': name, 'modifiedAt': modified_at, 'size': '', 'rawLine': ''}
        for name in parse_metrology_recipe_names(raw_text)
    ]
    return {
        'path': target_path,
        'exts': [],
        'titleBase': config['titleBase'],
        'items': items,
    }

def get_entries_from_source_path(ftp_ip: str, ftp_id: str, ftp_pw: str, source_kind: str) -> dict[str, Any]:
    config = RECIPE_SOURCE_CONFIG.get(source_kind)
    if not config:
        raise ValueError(f"unsupported source kind: {source_kind}")

    if MOCK_MODE:
        items = MOCK_SOURCE_ITEMS.get(source_kind, [])
        return {
            "path": config["path"],
            "exts": list(config.get("exts", [])),
            "titleBase": config["titleBase"],
            "items": items,
        }

    if source_kind == 'metrologyRecipe':
        return get_metrology_source_entries(ftp_ip, ftp_id, ftp_pw)

    ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)
    try:
        entries = list_entries_at_path(ftp, str(config["path"]))
        filtered = filter_entries_by_exts(entries, list(config.get("exts", [])))
        return {
            "path": config["path"],
            "exts": list(config.get("exts", [])),
            "titleBase": config["titleBase"],
            "items": filtered,
        }
    finally:
        try:
            ftp.quit()
        except Exception:
            try:
                ftp.close()
            except Exception:
                pass


def parse_cas_slots(cas_text: str) -> list[dict[str, Any]]:
    cas_text = cas_text.replace("\r\n", "\n").replace("\r", "\n")
    slot_block_re = re.compile(r"\[Slot\s+(\d+)\]\s*\n(.*?)(?=\[Slot\s+\d+\]|\Z)", re.DOTALL)
    job_name_re = re.compile(r"(?:^|\n)Job Name=(.*?)(?:\n|\Z)")

    parsed: dict[int, str] = {}
    for slot_str, block in slot_block_re.findall(cas_text):
        slot_no = int(slot_str)
        m = job_name_re.search(block)
        job_name = m.group(1).strip() if m else ""
        parsed[slot_no] = job_name

    rows: list[dict[str, Any]] = []
    max_slot = max(parsed.keys(), default=24)
    max_slot = max(max_slot, 24)
    for slot_no in range(1, max_slot + 1):
        rows.append({
            "slot": slot_no,
            "jobName": parsed.get(slot_no, ""),
        })
    return rows


def normalize_job_name(name: str) -> str:
    return str(name or "").strip().upper()


def make_job_id(job_name: str) -> str:
    return f"JOB::{job_name}"


def make_recipe_id(recipe_name: str) -> str:
    return f"RCP::{recipe_name}"


def make_source_recipe_id(source_kind: str, recipe_name: str) -> str:
    return f"{SOURCE_RECIPE_PREFIX}{source_kind}::{recipe_name}"


def strip_source_recipe_ext(name: str, source_kind: str) -> str:
    text = str(name or '').strip()
    lowered = text.lower()
    for ext in [str(x).lower() for x in RECIPE_SOURCE_CONFIG.get(source_kind, {}).get('exts', [])]:
        if lowered.endswith(ext):
            return text[: len(text) - len(ext)]
    return text


def normalize_source_recipe_display_name(name: str, source_kind: str) -> str:
    return re.sub(r"\s+", "", strip_source_recipe_ext(name, source_kind).strip().lower())


def parse_temp_source_recipe_id(recipe_id: str) -> tuple[str, str] | None:
    if not recipe_id.startswith(TEMP_SOURCE_RECIPE_PREFIX):
        return None
    payload = recipe_id[len(TEMP_SOURCE_RECIPE_PREFIX):]
    if "::" not in payload:
        return None
    source_kind, recipe_name = payload.split("::", 1)
    return source_kind, recipe_name


def resolve_source_recipe_name(eqp_id: str, source_kind: str, recipe_name: str) -> str | None:
    target_norm = normalize_source_recipe_display_name(recipe_name, source_kind)
    if not target_norm:
        return None

    cache_key = (eqp_id, source_kind)
    cached = _get_recipe_source_cached(cache_key)
    items = list((cached or {}).get('items', []))
    if not items:
        ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqp_id)
        source = get_entries_from_source_path(ftp_ip, ftp_id, ftp_pw, source_kind)
        items = list(source.get('items', []))

    for item in items:
        candidate = str(item.get('name', '')).strip()
        if normalize_source_recipe_display_name(candidate, source_kind) == target_norm:
            return candidate
    return None


def build_temp_source_recipe_content(recipe_id: str, source_kind: str, recipe_name: str) -> dict[str, Any]:
    title_base = str(RECIPE_SOURCE_CONFIG.get(source_kind, {}).get('titleBase', 'Recipe'))
    if source_kind in {'isrmAlgorithm', 'rtpcRecipe'}:
        return {
            'recipe': {
                'id': recipe_id,
                'name': recipe_name,
                'modifiedAt': '',
                'sourceKind': source_kind,
                'columns': [],
                'rows': [],
            }
        }
    return {
        'recipe': {
            'id': recipe_id,
            'name': recipe_name,
            'modifiedAt': '',
            'sourceKind': source_kind,
            'columns': ['Info'],
            'rows': [{
                'Info': f'{title_base} placeholder preview for {recipe_name}',
            }],
        }
    }


def parse_source_recipe_id(recipe_id: str) -> tuple[str, str] | None:
    if not recipe_id.startswith(SOURCE_RECIPE_PREFIX):
        return None
    payload = recipe_id[len(SOURCE_RECIPE_PREFIX):]
    if "::" not in payload:
        return None
    source_kind, recipe_name = payload.split("::", 1)
    return source_kind, recipe_name

def find_source_recipe_modified_at(eqp_id: str, source_kind: str, recipe_name: str) -> str:
    cache_key = (eqp_id, source_kind)
    cached = _get_recipe_source_cached(cache_key)
    if cached:
        for item in cached.get("items", []):
            if str(item.get("name", "")) == recipe_name:
                return str(item.get("modifiedAt", ""))

    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqp_id)
    source = get_entries_from_source_path(ftp_ip, ftp_id, ftp_pw, source_kind)
    for item in source.get("items", []):
        if str(item.get("name", "")) == recipe_name:
            return str(item.get("modifiedAt", ""))
    return ""


def extract_job_line_value(job_text: str, patterns: list[str], default: str = NONE_LABEL) -> str:
    normalized = job_text.replace("\r\n", "\n").replace("\r", "\n")
    for pattern in patterns:
        m = re.search(pattern, normalized, flags=re.MULTILINE | re.IGNORECASE)
        if not m:
            continue
        value = str(m.group(1)).strip()
        return value or default
    return default


def extract_job_bool(job_text: str, key: str, default: bool = False) -> bool:
    pattern = rf"^\s*{re.escape(key)}\s*=\s*(TRUE|FALSE)\s*$"
    m = re.search(pattern, job_text.replace("\r\n", "\n").replace("\r", "\n"), flags=re.MULTILINE | re.IGNORECASE)
    if not m:
        return default
    return m.group(1).strip().upper() == "TRUE"


def ensure_job_parsed_shape(parsed: Any) -> dict[str, Any]:
    result = parsed if isinstance(parsed, dict) else {}

    result.setdefault("preMetrology", {"enabled": False, "recipe": NONE_LABEL})
    result.setdefault("polisher", {"route": False, "rows": []})
    result.setdefault("cleaner", {"route": False, "numberOfSteps": 0, "rows": []})
    result.setdefault("postMetrology", {"enabled": False, "recipe": NONE_LABEL})

    for key in ("preMetrology", "postMetrology"):
        section = result.get(key)
        if not isinstance(section, dict):
            section = {}
            result[key] = section
        section.setdefault("enabled", False)
        section.setdefault("recipe", NONE_LABEL)

    polisher = result.get("polisher")
    if not isinstance(polisher, dict):
        polisher = {}
        result["polisher"] = polisher
    polisher.setdefault("route", False)
    polisher.setdefault("rows", [])

    cleaner = result.get("cleaner")
    if not isinstance(cleaner, dict):
        cleaner = {}
        result["cleaner"] = cleaner
    cleaner.setdefault("route", False)
    cleaner.setdefault("numberOfSteps", 0)
    cleaner.setdefault("rows", [])

    return result


def enrich_job_parsed(parsed: Any, job_text: str) -> dict[str, Any]:
    result = ensure_job_parsed_shape(parsed)

    result["useHeads"] = {
        "head1": extract_job_bool(job_text, "Use Head 1"),
        "head2": extract_job_bool(job_text, "Use Head 2"),
        "head3": extract_job_bool(job_text, "Use Head 3"),
        "head4": extract_job_bool(job_text, "Use Head 4"),
    }

    result["hcluRecipes"] = {
        "postLoad": extract_job_line_value(
            job_text,
            [r"^\s*HCLU Clean Recipe\s*=\s*(.*?)\s*$"],
        ),
        "preUnload": extract_job_line_value(
            job_text,
            [
                r"^\s*HCLU Clean Recipe Pre Unload\s*=\s*(.*?)\s*$",
                r"^\s*HCLU Clean Recipe Post Load\s*=\s*(.*?)\s*$",
            ],
        ),
    }

    return result


def get_or_bootstrap_eqp(eqp_id: str) -> dict[str, Any]:
    bootstrap = BOOTSTRAP_CACHE.get(eqp_id)
    if bootstrap:
        return bootstrap

    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqp_id)
    ftp_result = get_ftp_file_list(ftp_ip, ftp_id, ftp_pw)
    data = {
        "eqpId": eqp_id,
        "meta": {
            "ftpServer": ftp_ip,
            "resolvedPaths": ftp_result["resolved_paths"],
            "childrenUnderLcmp": ftp_result["children"],
            "counts": {
                "cas": len(ftp_result["cas_list"]),
                "job": len(ftp_result["job_list"]),
                "recipe": len(ftp_result["recipe_list"]),
            },
        },
        "casList": ftp_result["cas_list"],
        "jobList": [
            {
                "id": make_job_id(x["name"]),
                "jobName": x["name"],
                "recipeName": NONE_LABEL,
                "modifiedAt": x["modifiedAt"],
            }
            for x in ftp_result["job_list"]
        ],
        "recipeList": [
            {"id": make_recipe_id(x["name"]), "name": x["name"], "modifiedAt": x["modifiedAt"]}
            for x in ftp_result["recipe_list"]
        ],
        "casToJobs": {},
    }
    BOOTSTRAP_CACHE[eqp_id] = data
    return data


def resolve_eqp_child_path(eqp_id: str, kind: Literal["cas", "job", "recipe"]) -> tuple[str, str]:
    bootstrap = get_or_bootstrap_eqp(eqp_id)
    resolved = bootstrap.get("meta", {}).get("resolvedPaths", {})
    base_path = str(resolved.get("base") or r"\CMPDB\Lcmp")
    child = str(resolved.get(kind) or "")
    if not child:
        raise ValueError(f"{kind} path not found for {eqp_id}")
    return base_path, child


def resolve_item_path(eqp_id: str, kind: Literal["cas", "job", "recipe"], source_kind: str | None = None) -> str:
    if kind == "recipe" and source_kind and source_kind in RECIPE_SOURCE_CONFIG:
        return str(RECIPE_SOURCE_CONFIG[source_kind]["path"])

    base_path, child = resolve_eqp_child_path(eqp_id, kind if kind != "recipe" else "recipe")
    return os.path.join(base_path, child)


def write_local_shadow_file(file_name: str, data: bytes) -> str:
    return svc_write_local_shadow_file(file_name, data)

def sanitize_file_name(name: str, fallback_ext: str = "") -> str:
    clean = str(name or "").strip().replace("/", "_").replace("\\", "_")
    clean = re.sub(r"\s+", " ", clean)
    if fallback_ext and clean and not clean.lower().endswith(fallback_ext.lower()):
        clean = f"{clean}{fallback_ext}"
    return clean


def normalize_saved_job_name(name: str) -> str:
    raw = str(name or "").strip()
    if raw.startswith("JOB::"):
        raw = raw.split("::", 1)[1]
    raw = validate_ascii_target_name(raw)
    return sanitize_file_name(raw, ".job")


def normalize_saved_cas_name(name: str) -> str:
    return sanitize_file_name(validate_ascii_target_name(name), '.cas')


def normalize_saved_recipe_name(source_name: str, target_name: str) -> str:
    ext = Path(str(source_name or '')).suffix
    return sanitize_file_name(validate_ascii_target_name(target_name), ext)


def update_bootstrap_name(eqp_id: str, kind: Literal['cas', 'job', 'recipe'], source_name: str, target_name: str) -> None:
    bootstrap = BOOTSTRAP_CACHE.get(eqp_id)
    if not bootstrap:
        return
    if kind == 'cas':
        for item in bootstrap.get('casList', []):
            if str(item.get('name', '')) == source_name:
                item['name'] = target_name
                break
    elif kind == 'job':
        for item in bootstrap.get('jobList', []):
            if str(item.get('jobName', '')) == source_name or str(item.get('id', '')) == make_job_id(source_name):
                item['jobName'] = target_name
                item['id'] = make_job_id(target_name)
                break
    else:
        for item in bootstrap.get('recipeList', []):
            if str(item.get('name', '')) == source_name or str(item.get('id', '')) == make_recipe_id(source_name):
                item['name'] = target_name
                item['id'] = make_recipe_id(target_name)
                break


def remove_bootstrap_name(eqp_id: str, kind: Literal['cas', 'job', 'recipe'], file_name: str) -> None:
    bootstrap = BOOTSTRAP_CACHE.get(eqp_id)
    if not bootstrap:
        return
    if kind == 'cas':
        bootstrap['casList'] = [x for x in bootstrap.get('casList', []) if str(x.get('name', '')) != file_name]
    elif kind == 'job':
        bootstrap['jobList'] = [x for x in bootstrap.get('jobList', []) if str(x.get('jobName', '')) != file_name and str(x.get('id', '')) != make_job_id(file_name)]
    else:
        bootstrap['recipeList'] = [x for x in bootstrap.get('recipeList', []) if str(x.get('name', '')) != file_name and str(x.get('id', '')) != make_recipe_id(file_name)]


def update_recipe_source_cache_name(eqp_id: str, source_kind: str | None, source_name: str, target_name: str) -> None:
    if not source_kind:
        return
    entry = RECIPE_SOURCE_CACHE.get((eqp_id, source_kind))
    if not entry:
        return
    cache = entry[1]
    for item in cache.get('items', []):
        if str(item.get('name', '')) == source_name:
            item['name'] = target_name
            item['id'] = make_source_recipe_id(source_kind, target_name)
            break


def remove_recipe_source_cache_name(eqp_id: str, source_kind: str | None, file_name: str) -> None:
    if not source_kind:
        return
    cache_key = (eqp_id, source_kind)
    entry = RECIPE_SOURCE_CACHE.get(cache_key)
    if not entry:
        return
    entry[1]['items'] = [x for x in entry[1].get('items', []) if str(x.get('name', '')) != file_name]


def build_minimal_cas_text(slots: list[dict[str, Any]]) -> str:
    slot_map = {int(x.get("slot", 0)): str(x.get("jobName", "")).strip() for x in slots if int(x.get("slot", 0)) > 0}
    lines: list[str] = []
    max_slot = max(max(slot_map.keys(), default=24), 24)
    for slot_no in range(1, max_slot + 1):
        lines.append(f"[Slot {slot_no}]")
        lines.append(f"Job Name={slot_map.get(slot_no, '')}")
        lines.append("")
    return "\r\n".join(lines).rstrip() + "\r\n"


def patch_cas_text(original_text: str, slots: list[dict[str, Any]]) -> str:
    normalized = (original_text or "").replace("\r\n", "\n").replace("\r", "\n")
    if not normalized.strip():
        return build_minimal_cas_text(slots)

    slot_map = {int(x.get("slot", 0)): str(x.get("jobName", "")).strip() for x in slots if int(x.get("slot", 0)) > 0}
    pattern = re.compile(r"(\[Slot\s+(\d+)\]\s*\n)(.*?)(?=(?:\[Slot\s+\d+\]\s*\n)|\Z)", re.DOTALL)
    parts: list[str] = []
    last_pos = 0
    seen: set[int] = set()

    for m in pattern.finditer(normalized):
        parts.append(normalized[last_pos:m.start()])
        header = m.group(1)
        slot_no = int(m.group(2))
        body = m.group(3)
        if slot_no in slot_map:
            seen.add(slot_no)
            if re.search(r"(?im)^Job Name=.*$", body):
                body = re.sub(r"(?im)^Job Name=.*$", f"Job Name={slot_map[slot_no]}", body, count=1)
            else:
                body = f"Job Name={slot_map[slot_no]}\n" + body
        parts.append(header + body)
        last_pos = m.end()
    parts.append(normalized[last_pos:])

    patched = "".join(parts).rstrip("\n")
    missing_slots = [slot for slot in sorted(slot_map.keys()) if slot not in seen]
    if missing_slots:
        append_lines: list[str] = [patched, ""]
        for slot_no in missing_slots:
            append_lines.extend([
                f"[Slot {slot_no}]",
                f"Job Name={slot_map[slot_no]}",
                "",
            ])
        patched = "\n".join(append_lines)

    return patched.replace("\n", "\r\n").rstrip() + "\r\n"


def bool_to_tf(flag: bool) -> str:
    return "TRUE" if flag else "FALSE"


def replace_or_append_line(text_value: str, candidate_keys: list[str], new_value: str) -> tuple[str, bool]:
    normalized = text_value.replace("\r\n", "\n").replace("\r", "\n")
    for key in candidate_keys:
        pattern = re.compile(rf"^\s*{re.escape(key)}\s*=\s*.*$", re.IGNORECASE | re.MULTILINE)
        if pattern.search(normalized):
            return pattern.sub(f"{key}={new_value}", normalized, count=1), True
    if not normalized.endswith("\n"):
        normalized += "\n"
    normalized += f"{candidate_keys[0]}={new_value}\n"
    return normalized, False



def replace_or_append_in_named_section(text_value: str, section_name: str, candidate_keys: list[str], new_value: str) -> tuple[str, bool]:
    normalized = text_value.replace("\r\n", "\n").replace("\r", "\n")
    section_re = re.compile(rf"(?ms)(^\[{re.escape(section_name)}\]\s*\n)(.*?)(?=^\[|\Z)")
    match = section_re.search(normalized)
    if not match:
        if normalized and not normalized.endswith("\n"):
            normalized += "\n"
        normalized += f"[{section_name}]\n{candidate_keys[0]}={new_value}\n"
        return normalized, False

    body = match.group(2)
    for key in candidate_keys:
        pattern = re.compile(rf"^\s*{re.escape(key)}\s*=\s*.*$", re.IGNORECASE | re.MULTILINE)
        if pattern.search(body):
            body = pattern.sub(f"{key}={new_value}", body, count=1)
            return normalized[:match.start(2)] + body + normalized[match.end(2):], True

    if body and not body.endswith("\n"):
        body += "\n"
    body += f"{candidate_keys[0]}={new_value}\n"
    return normalized[:match.start(2)] + body + normalized[match.end(2):], False

def encode_polisher_file_value(label: str, value: Any) -> str:
    raw = str(value if value is not None else '').strip()
    if label == 'Special Ex Situ':
        return '0' if raw in ('', NONE_LABEL) else raw
    if label == 'FT Algorithm':
        return '' if raw in ('', NONE_LABEL) else raw
    return raw or NONE_LABEL


def section_has_key_in_named_section(text_value: str, section_name: str, key: str) -> bool:
    normalized = text_value.replace("\r\n", "\n").replace("\r", "\n")
    section_re = re.compile(rf"(?ms)(^\[{re.escape(section_name)}\]\s*\n)(.*?)(?=^\[|\Z)")
    match = section_re.search(normalized)
    if not match:
        return False
    body = match.group(2)
    pattern = re.compile(rf"^\s*{re.escape(key)}\s*=\s*.*$", re.IGNORECASE | re.MULTILINE)
    return bool(pattern.search(body))


def replace_or_append_with_preferred_key_in_named_section(
    text_value: str,
    section_name: str,
    preferred_keys: list[str],
    append_key: str,
    new_value: str,
) -> tuple[str, bool]:
    normalized = text_value.replace("\r\n", "\n").replace("\r", "\n")
    section_re = re.compile(rf"(?ms)(^\[{re.escape(section_name)}\]\s*\n)(.*?)(?=^\[|\Z)")
    match = section_re.search(normalized)
    if not match:
        if normalized and not normalized.endswith("\n"):
            normalized += "\n"
        normalized += f"[{section_name}]\n{append_key}={new_value}\n"
        return normalized, False

    body = match.group(2)
    for key in preferred_keys:
        pattern = re.compile(rf"^\s*{re.escape(key)}\s*=\s*.*$", re.IGNORECASE | re.MULTILINE)
        if pattern.search(body):
            body = pattern.sub(f"{key}={new_value}", body, count=1)
            return normalized[:match.start(2)] + body + normalized[match.end(2):], True

    if body and not body.endswith("\n"):
        body += "\n"
    body += f"{append_key}={new_value}\n"
    return normalized[:match.start(2)] + body + normalized[match.end(2):], False


def patch_job_text_from_parsed(original_text: str, parsed: dict[str, Any]) -> tuple[str, dict[str, int]]:
    normalized = (original_text or "").replace("\r\n", "\n").replace("\r", "\n")
    result = ensure_job_parsed_shape(parsed)
    summary: dict[str, int] = {"matched": 0, "appended": 0}

    row_key_map = {
        "Polish Recipe": "Polish Recipe",
        "Condition Recipe": "Condition Recipe",
        "Ex Situ Condition": "Ex Situ Condition Recipe",
        "Special Ex Situ": "Ex Situ Conditioning Optimization",
        "ISRM Algorithm": "ISRM Algorithm",
        "WL Algorithm": "WL Algorithm",
        "RTPC Recipe": "RTPC Recipe",
        "PRC Algorithm": "PRC Algorithm",
        "FT Algorithm": "FT Algorithm",
    }

    normalized, matched = replace_or_append_in_named_section(
        normalized,
        "Pre-Metrology",
        ["Do Pre Metrology", "Use Pre Metrology", "Pre Metrology Enabled"],
        bool_to_tf(bool(result.get("preMetrology", {}).get("enabled", False))),
    )
    summary["matched" if matched else "appended"] += 1
    normalized, matched = replace_or_append_in_named_section(
        normalized,
        "Pre-Metrology",
        ["Recipe"],
        str(result.get("preMetrology", {}).get("recipe", NONE_LABEL)),
    )
    summary["matched" if matched else "appended"] += 1

    normalized, matched = replace_or_append_in_named_section(
        normalized,
        "Post-Metrology",
        ["Do Post Metrology", "Use Post Metrology", "Post Metrology Enabled"],
        bool_to_tf(bool(result.get("postMetrology", {}).get("enabled", False))),
    )
    summary["matched" if matched else "appended"] += 1
    normalized, matched = replace_or_append_in_named_section(
        normalized,
        "Post-Metrology",
        ["Recipe"],
        str(result.get("postMetrology", {}).get("recipe", NONE_LABEL)),
    )
    summary["matched" if matched else "appended"] += 1

    normalized, matched = replace_or_append_in_named_section(
        normalized,
        "Polisher",
        ["Route to Polisher"],
        bool_to_tf(bool(result.get("polisher", {}).get("route", False))),
    )
    summary["matched" if matched else "appended"] += 1

    polisher_rows = result.get("polisher", {}).get("rows", []) if isinstance(result.get("polisher", {}).get("rows", []), list) else []
    for row in polisher_rows:
        label = str(row.get("label", "")).strip()
        canonical = row_key_map.get(label, label)
        if not canonical:
            continue
        for platen_idx, key in ((1, "p1"), (2, "p2"), (3, "p3")):
            display_value = row.get(key, NONE_LABEL)
            file_value = encode_polisher_file_value(label, display_value)

            if label == 'RTPC Recipe':
                icmp_key = f"Platen {platen_idx} ICMP Algorithm"
                rtpc_key = f"Platen {platen_idx} RTPC Recipe"
                existing_icmp = get_existing_value_in_named_section(normalized, 'Polisher', icmp_key)
                existing_rtpc = get_existing_value_in_named_section(normalized, 'Polisher', rtpc_key)
                if file_value in ('', NONE_LABEL) and (existing_icmp or existing_rtpc):
                    file_value = existing_icmp or existing_rtpc
                normalized, matched = replace_or_append_with_preferred_key_in_named_section(
                    normalized,
                    'Polisher',
                    [icmp_key, rtpc_key],
                    icmp_key,
                    file_value,
                )
            else:
                normalized, matched = replace_or_append_in_named_section(
                    normalized,
                    'Polisher',
                    [f"Platen {platen_idx} {canonical}"],
                    file_value,
                )
            summary["matched" if matched else "appended"] += 1

    cleaner = result.get("cleaner", {}) or {}
    normalized, matched = replace_or_append_in_named_section(
        normalized,
        "Cleaner",
        ["Route to Cleaner"],
        bool_to_tf(bool(cleaner.get("route", False))),
    )
    summary["matched" if matched else "appended"] += 1

    cleaner_rows = cleaner.get("rows", []) if isinstance(cleaner.get("rows", []), list) else []
    normalized, matched = replace_or_append_in_named_section(normalized, "Cleaner", ["Number of Steps"], str(len(cleaner_rows)))
    summary["matched" if matched else "appended"] += 1
    for idx, row in enumerate(cleaner_rows):
        module = str(row.get("module", NONE_LABEL)).strip() or NONE_LABEL
        recipe = str(row.get("recipe", NONE_LABEL)).strip() or NONE_LABEL
        normalized, matched = replace_or_append_in_named_section(normalized, "Cleaner", [f"Step {idx} Station ID"], module)
        summary["matched" if matched else "appended"] += 1
        normalized, matched = replace_or_append_in_named_section(normalized, "Cleaner", [f"Step {idx} Recipe"], recipe)
        summary["matched" if matched else "appended"] += 1

    if isinstance(result.get("useHeads"), dict):
        for head_no in range(1, 5):
            flag = bool(result["useHeads"].get(f"head{head_no}"))
            normalized, matched = replace_or_append_line(normalized, [f"Use Head {head_no}"], bool_to_tf(flag))
            summary["matched" if matched else "appended"] += 1

    hclu = result.get("hcluRecipes") or {}
    normalized, matched = replace_or_append_line(normalized, ["HCLU Clean Recipe"], str(hclu.get("postLoad", NONE_LABEL)))
    summary["matched" if matched else "appended"] += 1
    normalized, matched = replace_or_append_line(normalized, ["HCLU Clean Recipe Pre Unload", "HCLU Clean Recipe Post Load"], str(hclu.get("preUnload", NONE_LABEL)))
    summary["matched" if matched else "appended"] += 1

    return normalized.replace("\n", "\r\n").rstrip() + "\r\n", summary

def validate_transfer_scope(items: list[TransferCartItem], target_eqp_ids: list[str]) -> dict[str, str]:
    if not items:
        raise ValueError("이동할 항목이 없습니다.")
    if not target_eqp_ids:
        raise ValueError("대상 설비를 선택하세요.")

    meta_map = get_eqp_meta_map()
    source_eqp_ids = {item.sourceEqpId for item in items}
    source_meta = [meta_map.get(eqp) for eqp in source_eqp_ids]
    if any(meta is None for meta in source_meta):
        raise ValueError("Source 설비 메타 정보를 찾을 수 없습니다.")

    base_meta = source_meta[0] or {}
    maker = str(base_meta.get("maker", "")).strip()
    model_group = str(base_meta.get("modelGroup", "")).strip()

    for meta in source_meta[1:]:
        if str(meta.get("maker", "")).strip() != maker:
            raise ValueError("Cart 안의 파일은 같은 Maker 설비에서만 함께 이동할 수 있습니다.")
        if model_group and str(meta.get("modelGroup", "")).strip() != model_group:
            raise ValueError("Cart 안의 파일은 같은 설비군(model_group)끼리만 함께 이동할 수 있습니다.")

    for target_eqp_id in target_eqp_ids:
        meta = meta_map.get(target_eqp_id)
        if not meta:
            raise ValueError(f"Target 설비 메타 정보를 찾을 수 없습니다: {target_eqp_id}")
        if str(meta.get("maker", "")).strip() != maker:
            raise ValueError("같은 Maker 설비끼리만 Transfer 가능합니다.")
        if model_group and str(meta.get("modelGroup", "")).strip() != model_group:
            raise ValueError("같은 설비군(model_group)끼리만 Recipe Transfer 가 가능합니다.")

    return {"maker": maker, "modelGroup": model_group}


def copy_file_between_eqp(item: TransferCartItem, target_eqp_id: str) -> dict[str, Any]:
    source_kind = item.sourceKind or 'recipe'
    source_path = resolve_item_path(item.sourceEqpId, item.kind, source_kind)
    target_path = resolve_item_path(target_eqp_id, item.kind, source_kind)
    write_info = ftp_copy_with_shadow(item.sourceEqpId, source_path, item.name, target_eqp_id, target_path, item.name)
    return {
        'targetEqpId': target_eqp_id,
        'name': item.name,
        'kind': item.kind,
        'path': target_path,
        'status': 'moved',
        'overwrote': bool(write_info.get('overwrote')),
        'writtenBytes': int(write_info.get('writtenBytes', 0)),
    }


def rename_item_on_ftp(req: RenameFileRequest) -> dict[str, Any]:
    source_kind = req.sourceKind or 'recipe'
    path = resolve_item_path(req.eqpId, req.kind, source_kind)
    if req.kind == 'cas':
        target_name = normalize_saved_cas_name(req.targetName)
    elif req.kind == 'job':
        target_name = normalize_saved_job_name(req.targetName)
    else:
        target_name = normalize_saved_recipe_name(req.sourceName, req.targetName)
    if req.sourceName == target_name:
        return {'status': 'noop', 'name': target_name, 'path': path, 'overwrote': False}
    result = ftp_copy_delete_with_shadow(req.eqpId, path, req.sourceName, target_name)
    update_bootstrap_name(req.eqpId, req.kind, req.sourceName, target_name)
    if req.kind == 'recipe':
        update_recipe_source_cache_name(req.eqpId, req.sourceKind, req.sourceName, target_name)
    return {'status': 'renamed', 'name': target_name, 'path': path, **result}


def delete_item_on_ftp(eqp_id: str, item: DeleteFileItem) -> dict[str, Any]:
    source_kind = item.sourceKind or 'recipe'
    path = resolve_item_path(eqp_id, item.kind, source_kind)
    result = ftp_delete_with_shadow(eqp_id, path, item.name)
    remove_bootstrap_name(eqp_id, item.kind, item.name)
    if item.kind == 'recipe':
        remove_recipe_source_cache_name(eqp_id, item.sourceKind, item.name)
    return {'status': 'deleted', 'kind': item.kind, 'name': item.name, 'path': path, **result}


@router.get('/eqp-options')
def get_eqp_options():
    try:
        items = load_eqp_master_options()
        return {
            "items": items,
            "lineOptions": sorted(set(x["line"] for x in items)),
            "teamOptions": sorted(set(x["team"] for x in items)),
            "eqpOptions": sorted(set(x["eqpId"] for x in items)),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/load")
def load_recipe_test(req: LoadRequest):
    try:
        ftp_ip, ftp_id, ftp_pw = load_eqp_ip(req.eqpId)

        ftp_result = get_ftp_file_list(ftp_ip, ftp_id, ftp_pw)
        cas_entries = ftp_result["cas_list"]
        job_entries = ftp_result["job_list"]
        recipe_entries = ftp_result["recipe_list"]

        recipe_list = [
            {"id": make_recipe_id(x["name"]), "name": x["name"], "modifiedAt": x["modifiedAt"]}
            for x in recipe_entries
        ]

        first_recipe_name = recipe_entries[0]["name"] if recipe_entries else NONE_LABEL

        job_list = [
            {
                "id": make_job_id(x["name"]),
                "jobName": x["name"],
                "recipeName": first_recipe_name,
                "modifiedAt": x["modifiedAt"],
            }
            for x in job_entries
        ]

        meta_map = get_eqp_meta_map()
        eqp_meta = meta_map.get(req.eqpId, {})

        data = {
            "eqpId": req.eqpId,
            "meta": {
                "ftpServer": ftp_ip,
                "resolvedPaths": ftp_result["resolved_paths"],
                "childrenUnderLcmp": ftp_result["children"],
                "maker": eqp_meta.get("maker", ""),
                "modelGroup": eqp_meta.get("modelGroup", ""),
                "counts": {
                    "cas": len(cas_entries),
                    "job": len(job_entries),
                    "recipe": len(recipe_entries),
                },
            },
            "casList": cas_entries,
            "jobList": job_list,
            "recipeList": recipe_list,
            "casToJobs": {},
        }

        BOOTSTRAP_CACHE[req.eqpId] = data
        return data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cas-content")
def get_cas_content(eqpId: str, casId: str):
    cache_key = (eqpId, casId)
    if cache_key in CAS_CACHE:
        return CAS_CACHE[cache_key]

    bootstrap = get_or_bootstrap_eqp(eqpId)

    meta = bootstrap.get("meta", {})
    resolved = meta.get("resolvedPaths", {})
    base_path = resolved.get("base")
    cas_dir = resolved.get("cas")

    if not base_path or not cas_dir:
        raise HTTPException(status_code=400, detail="CAS 경로 정보가 없습니다. Load를 다시 실행하세요.")

    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqpId)
    cas_text = ftp_read_text_in_child(ftp_ip, ftp_id, ftp_pw, base_path, cas_dir, casId)
    parsed_rows = parse_cas_slots(cas_text)

    job_lookup: dict[str, dict[str, Any]] = {}
    for x in bootstrap.get("jobList", []):
        if not isinstance(x, dict):
            continue
        job_name = x.get("jobName")
        if not job_name:
            continue
        job_lookup[normalize_job_name(job_name)] = x

    slots = []
    for row in parsed_rows:
        job_name = row.get("jobName", "")
        linked = job_lookup.get(normalize_job_name(job_name))
        slots.append(
            {
                "slot": row["slot"],
                "jobId": linked["id"] if linked else (make_job_id(job_name) if job_name else "J_NONE"),
                "jobName": job_name if job_name else NONE_LABEL,
                "recipeName": linked["recipeName"] if linked else "",
            }
        )

    result = {
        "casId": casId,
        "slots": slots,
        "jobIds": list({x["jobId"] for x in slots if x["jobId"] != "J_NONE"}),
        "raw": cas_text,
    }
    CAS_CACHE[cache_key] = result
    return result


@router.get("/job-content")
def get_job_content(eqpId: str, jobId: str):
    cache_key = (eqpId, jobId)
    if cache_key in JOB_CACHE and "parsed" in JOB_CACHE[cache_key]:
        return JOB_CACHE[cache_key]

    bootstrap = get_or_bootstrap_eqp(eqpId)

    job = next((x for x in bootstrap["jobList"] if x["id"] == jobId), None)
    if not job:
        raise HTTPException(status_code=404, detail=f"job not found: {jobId}")

    meta = bootstrap.get("meta", {})
    resolved = meta.get("resolvedPaths", {})
    base_path = resolved.get("base")
    job_dir = resolved.get("job")

    if not base_path or not job_dir:
        raise HTTPException(status_code=400, detail="JOB 경로 정보가 없습니다. Load를 다시 실행하세요.")

    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqpId)
    job_text = ftp_read_text_in_child(ftp_ip, ftp_id, ftp_pw, base_path, job_dir, job["jobName"])

    parsed = enrich_job_parsed(parse_job_text(job_text), job_text)

    result = {
        "jobId": jobId,
        "jobName": job["jobName"],
        "baseRecipeName": job.get("recipeName", NONE_LABEL),
        "parsed": parsed,
        "raw": job_text,
    }

    JOB_CACHE[cache_key] = result
    return result

@router.get('/history')
def get_history(limit: int = 500):
    try:
        return {'items': list_history_entries(limit)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/history-comments')
def get_history_comments():
    try:
        return {'comments': get_all_comments()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/history-comment')
def put_history_comment(body: dict):
    try:
        group_key = str(body.get('groupKey', '')).strip()
        comment = str(body.get('comment', '')).strip()
        comment_author = str(body.get('commentAuthor', '')).strip()
        if not group_key:
            raise HTTPException(status_code=422, detail='groupKey is required')
        set_history_comment(group_key, comment, comment_author)
        return {'status': 'ok'}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/metrology-source-debug")
def get_metrology_source_debug(eqpId: str):
    try:
        ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqpId)
        config = RECIPE_SOURCE_CONFIG['metrologyRecipe']
        target_path = str(config['path'])
        raw_text = read_metrology_source_text(ftp_ip, ftp_id, ftp_pw, target_path)
        names = parse_metrology_recipe_names(raw_text)
        return {
            'eqpId': eqpId,
            'path': target_path,
            'rawLength': len(raw_text),
            'preview': raw_text[:400],
            'parsedCount': len(names),
            'parsedNames': names[:100],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/recipe-source-list")
def get_recipe_source_list(eqpId: str, sourceKind: str):
    cache_key = (eqpId, sourceKind)
    cached = _get_recipe_source_cached(cache_key)
    if cached is not None:
        return cached

    if sourceKind not in RECIPE_SOURCE_CONFIG:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 sourceKind: {sourceKind}")

    config = RECIPE_SOURCE_CONFIG[sourceKind]
    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqpId)

    # metrologyRecipe and MOCK_MODE use the FTP-only path
    if MOCK_MODE or sourceKind == 'metrologyRecipe':
        try:
            source = get_entries_from_source_path(ftp_ip, ftp_id, ftp_pw, sourceKind)
            result = {
                "sourceKind": sourceKind,
                "titleBase": source["titleBase"],
                "path": source["path"],
                "exts": source["exts"],
                "readError": '',
                "items": [
                    {
                        "id": make_source_recipe_id(sourceKind, x["name"]),
                        "name": x["name"],
                        "modifiedAt": x.get("modifiedAt", ""),
                        "sourceKind": sourceKind,
                        "ext": next((ext for ext in source["exts"] if str(x["name"]).lower().endswith(ext.lower())), ""),
                    }
                    for x in source["items"]
                ],
            }
            RECIPE_SOURCE_CACHE[cache_key] = (time.time(), result)
            return result
        except Exception as e:
            if sourceKind == 'metrologyRecipe':
                result = {
                    'sourceKind': sourceKind,
                    'titleBase': config['titleBase'],
                    'path': config['path'],
                    'exts': list(config.get('exts', [])),
                    'readError': str(e),
                    'items': [],
                }
                RECIPE_SOURCE_CACHE[cache_key] = (time.time(), result)
                return result
            raise HTTPException(status_code=400, detail=str(e))

    # For all other sourceKinds: merge FTP (live) + DB cache + VM store
    source_path = str(config['path'])
    exts = list(config.get('exts', []))

    merged = list_cached_or_live_entries_for_source(eqpId, source_path, exts, ftp_ip, ftp_id, ftp_pw)

    items = [
        {
            "id": make_source_recipe_id(sourceKind, x["name"]),
            "name": x["name"],
            "modifiedAt": x.get("modifiedAt", ""),
            "sourceKind": sourceKind,
            "ext": str(x.get("ext") or ""),
        }
        for x in merged
        if str(x.get("name") or "").strip()
    ]
    result = {
        "sourceKind": sourceKind,
        "titleBase": str(config.get('titleBase', '')),
        "path": source_path,
        "exts": exts,
        "readError": '',
        "items": items,
    }
    RECIPE_SOURCE_CACHE[cache_key] = (time.time(), result)
    return result


@router.get("/recipe-content")
def get_recipe_content(eqpId: str, recipeId: str):
    cache_key = (eqpId, recipeId)
    if cache_key in RECIPE_CACHE:
        return RECIPE_CACHE[cache_key]

    source_parsed = parse_source_recipe_id(recipeId)
    if source_parsed:
        source_kind, recipe_name = source_parsed
        result = build_source_recipe_content(eqpId, recipeId, source_kind, recipe_name)
        RECIPE_CACHE[cache_key] = result
        return result

    temp_source_parsed = parse_temp_source_recipe_id(recipeId)
    if temp_source_parsed:
        source_kind, recipe_name = temp_source_parsed
        resolved_name = resolve_source_recipe_name(eqpId, source_kind, recipe_name)
        if resolved_name:
            resolved_id = make_source_recipe_id(source_kind, resolved_name)
            result = build_source_recipe_content(eqpId, resolved_id, source_kind, resolved_name)
        else:
            result = build_temp_source_recipe_content(recipeId, source_kind, recipe_name)
        RECIPE_CACHE[cache_key] = result
        return result

    bootstrap = get_or_bootstrap_eqp(eqpId)
    recipe = next((x for x in bootstrap["recipeList"] if x["id"] == recipeId), None)
    if not recipe:
        raise HTTPException(status_code=404, detail=f"recipe not found: {recipeId}")

    modified_at = recipe.get("modifiedAt", "")
    result = {
        "recipe": {
            "id": recipe["id"],
            "name": recipe["name"],
            "modifiedAt": modified_at,
            "sourceKind": "recipe",
            "columns": ["Key", "Value"],
            "rows": [
                {"Key": "RECIPE_NAME", "Value": recipe["name"]},
                {"Key": "MODIFIED_AT", "Value": modified_at},
                {"Key": "STATUS", "Value": "PLACEHOLDER_PREVIEW"},
                {"Key": "NOTE", "Value": "여기에 실제 decode 결과를 연결할 예정"},
            ],
        }
    }
    RECIPE_CACHE[cache_key] = result
    return result


@router.post("/cas/save")
def save_cas(req: SaveCasRequest):
    cache_key = (req.eqpId, req.casId)
    CAS_CACHE[cache_key] = {
        "casId": req.casId,
        "slots": req.slots,
        "jobIds": list({x["jobId"] for x in req.slots if x.get("jobId") and x["jobId"] != "J_NONE"}),
    }
    return {"status": "saved_to_cache"}


@router.post("/cas/persist")
def persist_cas(req: PersistCasRequest):
    request_time = now_history_ts()
    try:
        target_name = normalize_saved_cas_name(req.targetCasId)
        source_name = normalize_saved_cas_name(req.sourceCasId)
        target_path = resolve_item_path(req.eqpId, "cas")
        src_ip, src_id, src_pw = load_eqp_ip(req.eqpId)
        try:
            original_bytes = ftp_read_bytes_at_path(src_ip, src_id, src_pw, target_path, source_name)
            original_text = original_bytes.decode("utf-8", errors="ignore")
        except Exception:
            original_text = ""

        original_slots = parse_cas_slots(original_text) if original_text else []
        patched_text = patch_cas_text(original_text, req.slots)
        patched_bytes = patched_text.encode("utf-8")
        write_local_shadow_file(target_name, patched_bytes)
        ftp_write_bytes_at_path(src_ip, src_id, src_pw, target_path, target_name, patched_bytes)

        CAS_CACHE[(req.eqpId, target_name)] = {
            "casId": target_name,
            "slots": req.slots,
            "jobIds": list({x["jobId"] for x in req.slots if x.get("jobId") and x["jobId"] != "J_NONE"}),
            "raw": patched_text,
        }
        action_name = 'Edit' if target_name == source_name else 'Save As'
        detail = summarize_cas_slot_changes(original_slots, req.slots) if action_name == 'Edit' else f'{source_name} → {target_name}'
        record_history(action_name, req.actorName, req.actorTeam, req.eqpId, req.eqpId, 'cas', source_name, target_name, created_at=request_time, recipe_name=target_name if action_name == 'Save As' else source_name, detail=detail)
        return {"status": "saved_to_ftp", "savedAs": target_name, "targetPath": target_path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/job/save")
def save_job(req: SaveJobRequest):
    cache_key = (req.eqpId, req.jobId)
    bootstrap = BOOTSTRAP_CACHE.get(req.eqpId)
    job_name = req.jobId
    base_recipe_name = req.config.get("p1", NONE_LABEL)

    if bootstrap:
        found = next((x for x in bootstrap["jobList"] if x["id"] == req.jobId), None)
        if found:
            job_name = found["jobName"]
            base_recipe_name = found.get("recipeName", base_recipe_name)

    JOB_CACHE[cache_key] = {
        "jobId": req.jobId,
        "jobName": job_name,
        "baseRecipeName": base_recipe_name,
        "config": req.config,
    }
    return {"status": "saved_to_cache"}


@router.post("/job/persist")
def persist_job(req: PersistJobRequest):
    request_time = now_history_ts()
    try:
        bootstrap = get_or_bootstrap_eqp(req.eqpId)
        found = next((x for x in bootstrap.get("jobList", []) if x.get("id") == req.sourceJobId), None)
        if not found:
            raise ValueError(f"job not found: {req.sourceJobId}")

        source_name = str(found.get("jobName") or "")
        target_name = normalize_saved_job_name(req.targetJobName)
        target_path = resolve_item_path(req.eqpId, "job")
        ftp_ip, ftp_id, ftp_pw = load_eqp_ip(req.eqpId)
        original_bytes = ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, target_path, source_name)
        original_text = original_bytes.decode("utf-8", errors="ignore")
        original_parsed = parse_job_text(original_text) if original_text else ensure_job_parsed_shape({})
        patched_text, summary = patch_job_text_from_parsed(original_text, req.parsed)
        patched_bytes = patched_text.encode("utf-8")
        write_local_shadow_file(target_name, patched_bytes)
        ftp_write_bytes_at_path(ftp_ip, ftp_id, ftp_pw, target_path, target_name, patched_bytes)

        JOB_CACHE[(req.eqpId, req.sourceJobId)] = {
            "jobId": req.sourceJobId,
            "jobName": target_name,
            "baseRecipeName": found.get("recipeName", NONE_LABEL),
            "parsed": ensure_job_parsed_shape(req.parsed),
            "raw": patched_text,
        }
        action_name = 'Edit' if target_name == source_name else 'Save As'
        detail = summarize_job_changes(original_parsed, req.parsed) if action_name == 'Edit' else f'{source_name} → {target_name}'
        record_history(action_name, req.actorName, req.actorTeam, req.eqpId, req.eqpId, 'job', source_name, target_name, created_at=request_time, recipe_name=target_name if action_name == 'Save As' else source_name, detail=detail)
        return {
            "status": "saved_to_ftp",
            "savedAs": target_name,
            "targetPath": target_path,
            "patternSummary": summary,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/recipe/clone')
def clone_recipe(req: PersistRecipeRequest):
    request_time = now_history_ts()
    try:
        source_kind = str(req.sourceKind or 'recipe')
        source_name = str(req.sourceRecipeName or '').strip()
        if not source_name:
            raise ValueError('source recipe name is empty')
        target_name = normalize_saved_recipe_name(source_name, req.targetRecipeName)
        target_path = resolve_item_path(req.eqpId, 'recipe', source_kind)
        result = ftp_copy_with_shadow(req.eqpId, target_path, source_name, req.eqpId, target_path, target_name)
        record_history('Save As', req.actorName, req.actorTeam, req.eqpId, req.eqpId, 'recipe', source_name, target_name, created_at=request_time, recipe_name=target_name, detail=f'{source_name} → {target_name}')
        return {
            'status': 'saved_to_ftp',
            'savedAs': target_name,
            'targetPath': target_path,
            'overwrote': bool(result.get('overwrote')),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=format_ftp_error(e))


@router.post('/file/rename')
def rename_file(req: RenameFileRequest):
    request_time = now_history_ts()
    try:
        result = rename_item_on_ftp(req)
        record_history('Rename', req.actorName, req.actorTeam, req.eqpId, req.eqpId, req.kind, req.sourceName, result.get('name', req.targetName), created_at=request_time, recipe_name=result.get('name', req.targetName), detail=f'{req.sourceName} → {result.get("name", req.targetName)}')
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=format_ftp_error(e))


@router.post('/file/delete')
def delete_files(req: DeleteFilesRequest):
    request_time = now_history_ts()
    try:
        deleted = []
        failed = []
        for item in req.items:
            try:
                deleted_item = delete_item_on_ftp(req.eqpId, item)
                deleted.append(deleted_item)
                record_history('Delete', req.actorName, req.actorTeam, req.eqpId, '', item.kind, item.name, '', created_at=request_time, recipe_name=item.name)
            except Exception as e:
                failed.append({'kind': item.kind, 'name': item.name, 'reason': format_ftp_error(e)})
        status = 'ok' if deleted and not failed else ('partial' if deleted else 'failed')
        return {'status': status, 'deleted': deleted, 'failed': failed}
    except Exception as e:
        raise HTTPException(status_code=400, detail=format_ftp_error(e))


@router.post('/transfer')
def transfer_files(req: TransferRequest):
    request_time = now_history_ts()
    try:
        validate_transfer_scope(req.items, req.targetEqpIds)
        moved = []
        failed = []
        for item in req.items:
            for target_eqp_id in req.targetEqpIds:
                try:
                    moved_item = copy_file_between_eqp(item, target_eqp_id)
                    moved.append(moved_item)
                    record_history('Transfer', req.actorName, req.actorTeam, item.sourceEqpId, target_eqp_id, item.kind, item.name, item.name, created_at=request_time, recipe_name=item.name)
                except Exception as e:
                    reason = format_ftp_error(e)
                    failed.append({
                        'targetEqpId': target_eqp_id,
                        'name': item.name,
                        'kind': item.kind,
                        'sourceEqpId': item.sourceEqpId,
                        'reason': reason,
                    })
                    record_history('Transfer', req.actorName, req.actorTeam, item.sourceEqpId, target_eqp_id, item.kind, item.name, item.name, status='failed', reason=reason, created_at=request_time, recipe_name=item.name)
        status = 'ok' if moved and not failed else ('partial' if moved else 'failed')
        return {'status': status, 'moved': moved, 'failed': failed}
    except Exception as e:
        raise HTTPException(status_code=400, detail=format_ftp_error(e))


class InvalidateCacheRequest(BaseModel):
    eqpId: str


@router.post('/invalidate-runtime-cache')
def invalidate_runtime_cache(req: InvalidateCacheRequest):
    eqp_id = req.eqpId
    BOOTSTRAP_CACHE.pop(eqp_id, None)
    for cache in (CAS_CACHE, JOB_CACHE, RECIPE_CACHE, RECIPE_SOURCE_CACHE):
        keys_to_del = [k for k in cache if k[0] == eqp_id]
        for k in keys_to_del:
            cache.pop(k, None)
    return {'status': 'ok', 'eqpId': eqp_id}
