from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.config import MOCK_MODE
from app.services.auth_service import COOKIE_NAME, verify_jwt

router = APIRouter(prefix='/api/auth', tags=['auth'])

_MOCK_USER = {
    'loginId': 'mock_user',
    'userId': 'mock001',
    'username': 'Mock User',
    'deptName': 'Dev Team',
    'mail': 'mock@example.com',
    'compId': '', 'deptId': '', 'sabun': '',
    'grdName': '', 'mobile': '', 'surname': '', 'givenname': '',
}


@router.get('/config')
def get_config():
    return {'mockMode': MOCK_MODE}


@router.get('/me')
async def me(request: Request):
    if MOCK_MODE:
        return _MOCK_USER
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        return verify_jwt(token)
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
