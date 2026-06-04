from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any

from app.services.recipe_cache_store import insert_history_entry, list_history_entries_db


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
    d = asdict(entry)
    insert_history_entry(d)
    return d


def list_history_entries(limit: int = 500) -> list[dict[str, Any]]:
    return list_history_entries_db(limit)