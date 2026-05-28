from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import MOCK_MODE
from app.services.ebara_mockup import (
    EBARA_EQP_LIST,
    EBARA_RECIPE_CONTENTS,
    EBARA_RECIPE_FILE_LIST,
    decode_ebara_recipe,
    encode_ebara_recipe,
)

router = APIRouter(prefix='/api/ebara', tags=['ebara'])

# 세션 내 수정 내용 보관 (mockup 전용, 서버 재시작 시 초기화)
_recipe_store: dict[str, str] = {}  # key: f"{eqpId}::{name}"


def _store_key(eqp_id: str, name: str) -> str:
    return f"{eqp_id}::{name}"


def _get_recipe_text(eqp_id: str, name: str) -> str:
    key = _store_key(eqp_id, name)
    if key in _recipe_store:
        return _recipe_store[key]
    bare = name.strip()
    for k, v in EBARA_RECIPE_CONTENTS.items():
        if k.upper() == bare.upper():
            return v
    return ""


@router.get('/eqp-options')
def get_eqp_options():
    if MOCK_MODE:
        items = EBARA_EQP_LIST
    else:
        # TODO: 실제 PostgreSQL 조회 (MOCK_MODE=false 시)
        items = EBARA_EQP_LIST
    return {
        'items': items,
        'lineOptions': sorted(set(x['line'] for x in items)),
        'teamOptions': sorted(set(x['team'] for x in items)),
        'eqpOptions': sorted(set(x['eqpId'] for x in items)),
    }


@router.get('/files')
def get_files(eqpId: str):
    if not eqpId:
        raise HTTPException(status_code=400, detail='eqpId required')
    if MOCK_MODE:
        # 수정된 이름 반영
        files = list(EBARA_RECIPE_FILE_LIST)
        renamed = {k.split('::')[1]: v.split('::')[1] for k, v in _recipe_store.items()
                   if k.startswith(f'{eqpId}::__renamed__')}
        return files
    # TODO: 실제 FTP 연결
    return EBARA_RECIPE_FILE_LIST


@router.get('/recipe')
def get_recipe(eqpId: str, name: str):
    if not eqpId or not name:
        raise HTTPException(status_code=400, detail='eqpId and name required')
    text = _get_recipe_text(eqpId, name)
    rows = decode_ebara_recipe(text)
    return {'name': name, 'rows': rows}


class SaveBody(BaseModel):
    eqpId: str
    name: str
    rows: list[dict[str, str]]


@router.post('/recipe/save')
def save_recipe(body: SaveBody):
    text = encode_ebara_recipe(body.rows)
    _recipe_store[_store_key(body.eqpId, body.name)] = text
    return {'ok': True}


class RenameBody(BaseModel):
    eqpId: str
    oldName: str
    newName: str


@router.post('/recipe/rename')
def rename_recipe(body: RenameBody):
    new_name = body.newName.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail='newName required')
    old_key = _store_key(body.eqpId, body.oldName)
    new_key = _store_key(body.eqpId, new_name)
    if old_key in _recipe_store:
        _recipe_store[new_key] = _recipe_store.pop(old_key)
    else:
        # 원본 내용을 새 키로 복사
        text = _get_recipe_text(body.eqpId, body.oldName)
        _recipe_store[new_key] = text
    return {'ok': True, 'newName': new_name}
