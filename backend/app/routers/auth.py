from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.config import MOCK_MODE
from app.services.auth_service import (
    COOKIE_NAME, COOKIE_SECURE, JWT_EXPIRE_HOURS, SAML_SIGNOUT_URL,
    SAML_REDIRECT_AFTER_LOGIN,
    build_saml_request_data, create_jwt, get_saml_login_url,
    process_saml_response, verify_jwt,
)

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.get('/config')
def get_config():
    """인증 없이 호출 가능한 모드 정보 (프론트엔드 초기화용)."""
    return {'mockMode': MOCK_MODE}

_MOCK_USER = {
    'loginId': 'mock_user',
    'userId': 'mock001',
    'username': 'Mock User',
    'deptName': 'Dev Team',
    'mail': 'mock@example.com',
    'compId': '', 'deptId': '', 'sabun': '',
    'grdName': '', 'mobile': '', 'surname': '', 'givenname': '',
}


def _set_auth_cookie(response: RedirectResponse, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME, token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite='lax',
        max_age=JWT_EXPIRE_HOURS * 3600,
    )


@router.get('/login')
async def login(request: Request):
    if MOCK_MODE:
        token = create_jwt(_MOCK_USER)
        response = RedirectResponse(url=SAML_REDIRECT_AFTER_LOGIN, status_code=302)
        _set_auth_cookie(response, token)
        return response
    req_data = await build_saml_request_data(request)
    return RedirectResponse(url=get_saml_login_url(req_data), status_code=302)


@router.post('/saml/callback')
async def saml_callback(request: Request):
    req_data = await build_saml_request_data(request)
    try:
        user = process_saml_response(req_data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    token = create_jwt(user)
    response = RedirectResponse(url=SAML_REDIRECT_AFTER_LOGIN, status_code=302)
    _set_auth_cookie(response, token)
    return response


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


@router.get('/logout')
async def logout():
    signout_url = (SAML_SIGNOUT_URL + '?wa=wsignoutcleanup1.0') if SAML_SIGNOUT_URL else '/'
    response = RedirectResponse(url=signout_url, status_code=302)
    response.delete_cookie(COOKIE_NAME)
    return response
