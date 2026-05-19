from __future__ import annotations

import hashlib
import json
from fastapi import APIRouter, HTTPException

from app.services.recipe_cache_store import list_open_failures, list_inventory_entries, get_latest_version

router = APIRouter(prefix='/recipe-inventory', tags=['recipe-inventory'])

SOURCE_CONFIG = {
    'polishRecipe': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.pol'], 'titleBase': 'Polish Recipe'},
    'conditionRecipe': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.con'], 'titleBase': 'Condition Recipe'},
    'exSituCondition': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.con'], 'titleBase': 'Ex Situ Condition'},
    'specialExSitu': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.con'], 'titleBase': 'Special Ex Situ'},
    'hcluPostLoad': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.cln'], 'titleBase': 'HCLU Clean Recipe Post Load'},
    'hcluPreUnload': {'path': r'\CMPDB\Lcmp\Recipes', 'exts': ['.cln'], 'titleBase': 'HCLU Clean Recipe Pre Unload'},
    'megasonics': {'path': r'\CMPDB\Lcmp\Recipes\CLEANER', 'exts': ['.meg'], 'titleBase': 'Megasonics Recipe'},
    'brush1': {'path': r'\CMPDB\Lcmp\Recipes\CLEANER', 'exts': ['.br'], 'titleBase': 'Brush Recipe'},
    'brush2': {'path': r'\CMPDB\Lcmp\Recipes\CLEANER', 'exts': ['.br'], 'titleBase': 'Brush Recipe'},
    'vaporDryer': {'path': r'\CMPDB\Lcmp\Recipes\CLEANER', 'exts': ['.dryr', '.drpr'], 'titleBase': 'Vapor Dryer Recipe'},
    'isrmAlgorithm': {'path': r'\CMPDB\Endpoint', 'exts': ['.alg', '.seg'], 'titleBase': 'ISRM Algorithm'},
    'rtpcRecipe': {'path': r'\CMPDB\icmp\scx', 'exts': ['.scx'], 'titleBase': 'RTPC Recipe'},
}


def _item_id(source_kind: str, name: str) -> str:
    return f'RCP_SRC::{source_kind}::{name}'


def _build_snapshot(eqp_id: str) -> dict:
    source_lists: dict[str, list[dict]] = {}
    union: list[dict] = []
    for source_kind, cfg in SOURCE_CONFIG.items():
        raw = list_inventory_entries(eqp_id, cfg['path'], exts=cfg['exts'], include_absent=True)
        items: list[dict] = []
        for row in raw:
            name = str(row.get('name') or '').strip()
            if not name:
                continue
            item = {
                'id': _item_id(source_kind, name),
                'name': name,
                'modifiedAt': str(row.get('modifiedAt') or ''),
                'sourceKind': source_kind,
                'ext': str(row.get('ext') or ''),
                'livePresent': bool(row.get('livePresent')),
                'cached': True,
            }
            items.append(item)
            union.append(item)
        items.sort(key=lambda x: x['name'].lower())
        source_lists[source_kind] = items
    # de-duplicate union by sourceKind+name
    uniq = {(x['sourceKind'], x['name']): x for x in union}
    union_items = sorted(uniq.values(), key=lambda x: (x['sourceKind'], x['name'].lower()))
    hash_payload = [
        [it['sourceKind'], it['name'], it.get('modifiedAt',''), it.get('ext',''), 1 if it.get('livePresent') else 0]
        for it in union_items
    ]
    snapshot_hash = hashlib.sha1(json.dumps(hash_payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest() if hash_payload else ''
    return {
        'eqpId': eqp_id,
        'snapshotHash': snapshot_hash,
        'fileCount': len(union_items),
        'items': union_items,
        'sourceLists': source_lists,
        'sourceTitles': {k: v['titleBase'] for k, v in SOURCE_CONFIG.items()},
    }


@router.get('/failures')
def get_inventory_failures(limit: int = 500):
    try:
        return {'items': list_open_failures(limit)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/entries')
def get_inventory_entries(eqpId: str, sourcePath: str | None = None):
    try:
        return {'items': list_inventory_entries(eqpId, sourcePath)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/latest-version')
def get_latest_cached_version(eqpId: str, sourcePath: str, name: str):
    try:
        return {'item': get_latest_version(eqpId, sourcePath, name)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/snapshot')
def get_inventory_snapshot(eqpId: str):
    try:
        return _build_snapshot(str(eqpId or '').strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
