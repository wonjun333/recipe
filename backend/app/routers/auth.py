from __future__ import annotations

import logging
from pathlib import Path

import jwt
from fastapi import APIRouter, HTTPException, Request, Response

from app.config import AUTH_COOKIE_NAME, AUTH_MODE, JWT_CERT_PATH

router = APIRouter()
logger = logging.getLogger("recipe.auth")

_MOCK_USER = {
    "LoginId": "dev_user",
    "Username": "개발자",
    "DeptName": "개발팀",
    "Mail": "dev@company.com",
    "DisplayName": "개발자",
    "MailAccount": "dev",
}


@router.get("/api/auth/me")
def get_me(request: Request):
    if AUTH_MODE != "saml":
        return _MOCK_USER

    auth_token = request.cookies.get(AUTH_COOKIE_NAME)
    if not auth_token:
        logger.info(
            "SAML auth failed: cookie missing cookie_name=%s received_cookies=%s",
            AUTH_COOKIE_NAME,
            sorted(request.cookies.keys()),
        )
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        cert_path = Path(JWT_CERT_PATH)
        cert_pem = cert_path.read_text(encoding="utf-8")
        payload = jwt.decode(auth_token, cert_pem, algorithms=["RS256"])
        payload = _enrich_auth_payload(payload)
        logger.info(
            "SAML auth succeeded: login_id=%s username=%s token_length=%s cert_path=%s",
            payload.get("LoginId") or payload.get("sub"),
            payload.get("Username"),
            len(auth_token),
            cert_path,
        )
        return payload
    except Exception as exc:
        logger.info(
            "SAML auth failed: invalid token error=%s token_length=%s cert_path=%s",
            exc.__class__.__name__,
            len(auth_token),
            JWT_CERT_PATH,
        )
        raise HTTPException(status_code=401, detail="Invalid token") from exc


@router.post("/api/auth/logout")
def logout():
    response = Response(status_code=204)
    response.delete_cookie(AUTH_COOKIE_NAME)
    return response


def _enrich_auth_payload(payload: dict) -> dict:
    enriched = dict(payload)
    username = _clean_text(enriched.get("Username"))
    login_id = _clean_text(enriched.get("LoginId") or enriched.get("sub"))
    mail = _clean_text(enriched.get("Mail"))

    if username:
        enriched["DisplayName"] = username
    elif login_id:
        enriched["DisplayName"] = login_id

    if mail and "@" in mail:
        enriched["MailAccount"] = mail.split("@", 1)[0]
    elif mail:
        enriched["MailAccount"] = mail

    return enriched


def _clean_text(value: object) -> str:
    return str(value or "").strip()
