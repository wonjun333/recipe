from __future__ import annotations

from pathlib import Path
from typing import Optional

import jwt as pyjwt
from cryptography.x509 import load_pem_x509_certificate
from fastapi import APIRouter, Cookie, HTTPException

from app.config import MOCK_MODE, JWT_CERT_PATH

router = APIRouter()

_MOCK_USER = {
    "LoginId": "dev_user",
    "Username": "개발자",
    "DeptName": "개발팀",
    "Mail": "dev@company.com",
}


@router.get("/api/auth/me")
def get_me(auth_token: Optional[str] = Cookie(default=None)):
    if MOCK_MODE:
        return _MOCK_USER

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
