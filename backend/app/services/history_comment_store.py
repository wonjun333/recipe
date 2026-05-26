from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    from app.services.temp_file_store import LOCAL_EDIT_BASE  # type: ignore
except Exception:
    LOCAL_EDIT_BASE = Path('/tmp/recipe_test_staging')

_COMMENT_DIR = Path(LOCAL_EDIT_BASE) / 'history'
_COMMENT_FILE = _COMMENT_DIR / 'history_comments.json'


def _load() -> dict[str, Any]:
    if not _COMMENT_FILE.exists():
        return {}
    try:
        return json.loads(_COMMENT_FILE.read_text(encoding='utf-8'))
    except Exception:
        return {}


def _persist(data: dict[str, Any]) -> None:
    _COMMENT_DIR.mkdir(parents=True, exist_ok=True)
    _COMMENT_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def get_all_comments() -> dict[str, Any]:
    return _load()


def set_comment(group_key: str, comment: str, comment_author: str = '') -> None:
    data = _load()
    if comment:
        data[group_key] = {
            'comment': comment,
            'commentAuthor': comment_author,
            'updatedAt': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
    else:
        data.pop(group_key, None)
    _persist(data)
