from __future__ import annotations

from pathlib import Path

import jwt
from fastapi import APIRouter, HTTPException, Request, Response

from app.config import AUTH_COOKIE_NAME, AUTH_MODE, JWT_CERT_PATH

router = APIRouter()

_MOCK_USER = {
    "LoginId": "dev_user",
    "Username": "개발자",
    "DeptName": "개발팀",
    "Mail": "dev@company.com",
}


@router.get("/api/auth/me")
def get_me(request: Request):
    if AUTH_MODE != "saml":
        return _MOCK_USER

    auth_token = request.cookies.get(AUTH_COOKIE_NAME)
    if not auth_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        cert_pem = Path(JWT_CERT_PATH).read_text(encoding="utf-8")
        return jwt.decode(auth_token, cert_pem, algorithms=["RS256"])
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


@router.post("/api/auth/logout")
def logout():
    response = Response(status_code=204)
    response.delete_cookie(AUTH_COOKIE_NAME)
    return response
