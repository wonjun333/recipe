from __future__ import annotations

from fastapi import APIRouter, Response

from app.config import AUTH_COOKIE_NAME

router = APIRouter()

_MOCK_USER = {
    "LoginId": "dev_user",
    "Username": "개발자",
    "DeptName": "개발팀",
    "Mail": "dev@company.com",
}


@router.get("/api/auth/me")
def get_me():
    return _MOCK_USER


@router.post("/api/auth/logout")
def logout():
    response = Response(status_code=204)
    response.delete_cookie(AUTH_COOKIE_NAME)
    return response
