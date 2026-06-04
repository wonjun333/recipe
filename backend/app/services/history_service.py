from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    from app.services.temp_file_store import LOCAL_EDIT_BASE  # type: ignore
except Exception:
    LOCAL_EDIT_BASE = Path('/tmp/recipe_test_staging')

HISTORY_DIR = Path(LOCAL_EDIT_BASE) / 'history'
HISTORY_FILE = HISTORY_DIR / 'recipe_action_history.jsonl'
HISTORY_DIR.mkdir(parents=True, exist_ok=True)

@dataclass
class HistoryEntry:
    actorName: str
    actorTeam: str
    fromEqpId: str
    action: str
    toEqpId: str
    createdAt: str
    itemKind: str = ''
    sourceName: str = ''
    targetName: str = ''
    recipeName: str = ''
    requestId: str = ''
    status: str = 'ok'
    reason: str = ''
    detail: str = ''
    knoxid: str = ''
    fromEqpTeam: str = ''
    toEqpTeam: str = ''

def _normalize_text(value: Any) -> str:
    return str(value or '').strip()

def append_history_entry(**kwargs: Any) -> dict[str, Any]:
    entry = HistoryEntry(
        actorName=_normalize_text(kwargs.get('actorName')) or 'Unknown',
        actorTeam=_normalize_text(kwargs.get('actorTeam')),
        fromEqpId=_normalize_text(kwargs.get('fromEqpId')),
        action=_normalize_text(kwargs.get('action')),
        toEqpId=_normalize_text(kwargs.get('toEqpId')),
        createdAt=_normalize_text(kwargs.get('createdAt')) or datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        itemKind=_normalize_text(kwargs.get('itemKind')),
        sourceName=_normalize_text(kwargs.get('sourceName')),
        targetName=_normalize_text(kwargs.get('targetName')),
        recipeName=_normalize_text(kwargs.get('recipeName')),
        requestId=_normalize_text(kwargs.get('requestId')),
        status=_normalize_text(kwargs.get('status')) or 'ok',
        reason=_normalize_text(kwargs.get('reason')),
        detail=_normalize_text(kwargs.get('detail')),
        knoxid=_normalize_text(kwargs.get('knoxid')),
        fromEqpTeam=_normalize_text(kwargs.get('fromEqpTeam')),
        toEqpTeam=_normalize_text(kwargs.get('toEqpTeam')),
    )
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    with HISTORY_FILE.open('a', encoding='utf-8') as fp:
        fp.write(json.dumps(asdict(entry), ensure_ascii=False) + '\n')
    return asdict(entry)

def list_history_entries(limit: int = 500) -> list[dict[str, Any]]:
    if not HISTORY_FILE.exists():
        return []
    rows: list[dict[str, Any]] = []
    with HISTORY_FILE.open('r', encoding='utf-8') as fp:
        for line in fp:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                continue
    rows.sort(key=lambda x: str(x.get('createdAt', '')), reverse=True)
    return rows[:max(1, min(int(limit or 500), 5000))]