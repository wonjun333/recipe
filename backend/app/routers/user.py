from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.config import MOCK_MODE
from app.services.auth_service import COOKIE_NAME, verify_jwt
from app.services.recipe_cache_store import get_user_preferences, save_user_preferences

router = APIRouter(prefix='/api/user', tags=['user'])


def _get_login_id(request: Request) -> str:
    if MOCK_MODE:
        return 'mock_user'
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        user = verify_jwt(token)
        return user.get('loginId', '')
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid or expired token')


@router.get('/preferences')
def get_preferences(request: Request):
    login_id = _get_login_id(request)
    return get_user_preferences(login_id)


class PreferencesBody(BaseModel):
    line: str = ''
    team: str = ''


@router.put('/preferences')
def put_preferences(body: PreferencesBody, request: Request):
    login_id = _get_login_id(request)
    save_user_preferences(login_id, body.line, body.team)
    return {'ok': True}
