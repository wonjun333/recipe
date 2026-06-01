from __future__ import annotations

from pathlib import Path
import jwt as pyjwt
from cryptography.x509 import load_pem_x509_certificate
from fastapi import APIRouter, HTTPException, Request, Response

from app.config import MOCK_MODE, JWT_CERT_PATH, JWT_COOKIE_NAME

router = APIRouter()

_MOCK_USER = {
    "LoginId": "dev_user",
    "Username": "개발자",
    "DeptName": "개발팀",
    "Mail": "dev@company.com",
}


@router.get("/api/auth/me")
def get_me(request: Request):
    if MOCK_MODE:
        return _MOCK_USER

    auth_token = request.cookies.get(JWT_COOKIE_NAME)
    if not auth_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        cert_pem = Path(JWT_CERT_PATH).read_text(encoding="utf-8")
        cert_obj = load_pem_x509_certificate(cert_pem.encode())
        public_key = cert_obj.public_key()
        payload = pyjwt.decode(auth_token, public_key, algorithms=["RS256"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/api/auth/logout")
def logout():
    response = Response(status_code=204)
    response.delete_cookie(JWT_COOKIE_NAME)
    return response
