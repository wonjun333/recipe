from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    from app.services.temp_file_store import LOCAL_EDIT_BASE
    _BASE_DIR = Path(str(LOCAL_EDIT_BASE)) / 'recipe_vm_store'
except Exception:
    _BASE_DIR = Path('/tmp/recipe_vm_store')


def _now_ts() -> str:
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def _safe_parts(source_path: str) -> list[str]:
    raw = str(source_path or '').strip().replace('\\', '/')
    parts = [p.strip() for p in re.split(r'/+', raw) if p.strip()]
    return parts or ['unknown']


def ensure_root() -> Path:
    _BASE_DIR.mkdir(parents=True, exist_ok=True)
    return _BASE_DIR


def get_source_dir(eqp_id: str, source_path: str) -> Path:
    root = ensure_root() / str(eqp_id or '').strip()
    for part in _safe_parts(source_path):
        root = root / part
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_file_path(eqp_id: str, source_path: str, file_name: str) -> Path:
    return get_source_dir(eqp_id, source_path) / str(file_name or '').strip()


def get_meta_path(eqp_id: str, source_path: str, file_name: str) -> Path:
    p = get_file_path(eqp_id, source_path, file_name)
    return p.with_name(p.name + '.meta.json')


def save_vm_file(
    eqp_id: str,
    source_path: str,
    file_name: str,
    data: bytes,
    *,
    modified_at: str = '',
    size: str = '',
    source_kind: str = '',
    cloud_protected: bool = False,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    target = get_file_path(eqp_id, source_path, file_name)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)

    meta = {
        'eqpId': str(eqp_id or '').strip(),
        'sourcePath': str(source_path or '').strip(),
        'name': str(file_name or '').strip(),
        'modifiedAt': str(modified_at or '').strip(),
        'size': str(size or '').strip(),
        'sourceKind': str(source_kind or '').strip(),
        'cloudProtected': bool(cloud_protected),
        'capturedAt': _now_ts(),
    }
    if metadata:
        meta.update(metadata)

    meta_path = get_meta_path(eqp_id, source_path, file_name)
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')
    return meta


def read_vm_file_bytes(eqp_id: str, source_path: str, file_name: str) -> bytes | None:
    path = get_file_path(eqp_id, source_path, file_name)
    if not path.exists():
        return None
    try:
        return path.read_bytes()
    except Exception:
        return None


def read_vm_file_meta(eqp_id: str, source_path: str, file_name: str) -> dict[str, Any]:
    meta_path = get_meta_path(eqp_id, source_path, file_name)
    if not meta_path.exists():
        return {}
    try:
        return json.loads(meta_path.read_text(encoding='utf-8'))
    except Exception:
        return {}


def list_vm_entries(eqp_id: str, source_path: str, exts: list[str] | None = None) -> list[dict[str, Any]]:
    src_dir = get_source_dir(eqp_id, source_path)
    if not src_dir.exists():
        return []
    allowed = {str(x or '').lower() for x in (exts or [])}
    out: list[dict[str, Any]] = []
    for child in sorted(src_dir.iterdir(), key=lambda p: p.name.lower()):
        if not child.is_file():
            continue
        if child.name.endswith('.meta.json'):
            continue
        ext = child.suffix.lower()
        if allowed and ext not in allowed:
            continue
        meta = read_vm_file_meta(eqp_id, source_path, child.name)
        out.append({
            'eqpId': str(eqp_id or '').strip(),
            'sourcePath': str(source_path or '').strip(),
            'name': child.name,
            'ext': ext,
            'modifiedAt': str(meta.get('modifiedAt') or ''),
            'size': str(meta.get('size') or str(child.stat().st_size)),
            'livePresent': False,
            'cloudProtected': bool(meta.get('cloudProtected')),
            'sourceKind': str(meta.get('sourceKind') or ''),
            'capturedAt': str(meta.get('capturedAt') or ''),
            'storagePath': str(child),
        })
    return out