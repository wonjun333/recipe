from __future__ import annotations

from app.config import MONGO_URL

_mongo_client = None


def _get_mongo_client():
    global _mongo_client
    if _mongo_client is None:
        from pymongo import MongoClient
        _mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
    return _mongo_client


def get_user_part(knoxid: str) -> str:
    if not knoxid:
        return ''
    try:
        doc = _get_mongo_client()['ADDCMP']['ADDCMP_ADDRESS'].find_one(
            {'KNOX_ID': knoxid},
            {'_id': 0, 'PART': 1},
        )
        if not doc:
            return ''
        return str(doc.get('PART') or '').strip()
    except Exception:
        return ''
