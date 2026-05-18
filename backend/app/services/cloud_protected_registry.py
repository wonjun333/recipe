from __future__ import annotations

import csv
from pathlib import Path

_DEFAULT_PATH = Path(__file__).resolve().parents[1] / 'data' / 'cloud_protected_files.csv'
_CACHE: tuple[float | None, set[str]] | None = None


def registry_path() -> Path:
    return _DEFAULT_PATH


def _normalize_name(name: str) -> str:
    text = str(name or '').strip()
    if text.lower().endswith('.dypr'):
        return text[:-5] + '.drpr'
    return text


def load_cloud_protected_recipe_ids() -> set[str]:
    global _CACHE
    path = registry_path()
    mtime = path.stat().st_mtime if path.exists() else None
    if _CACHE and _CACHE[0] == mtime:
        return _CACHE[1]

    items: set[str] = set()
    if path.exists():
        with path.open('r', encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = _normalize_name(row.get('rcp_id') or '')
                if name:
                    items.add(name.lower())

    _CACHE = (mtime, items)
    return items


def is_cloud_protected_file(file_name: str) -> bool:
    return _normalize_name(file_name).lower() in load_cloud_protected_recipe_ids()