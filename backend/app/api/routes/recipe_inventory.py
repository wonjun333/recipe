from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.api.routes.recipe_test_impl import get_inventory_snapshot
from app.services.recipe_cache_store import list_open_failures, list_inventory_entries, get_latest_version, get_inventory_state

router = APIRouter(prefix='/recipe-inventory', tags=['recipe-inventory'])

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


@router.get('/state')
def get_equipment_inventory_state(eqpId: str):
    try:
        return get_inventory_state(eqpId)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/snapshot')
def get_recipe_snapshot(eqpId: str):
    try:
        return get_inventory_snapshot(eqpId)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
