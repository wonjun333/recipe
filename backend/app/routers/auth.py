from __future__ import annotations

import logging
from pathlib import Path

import jwt
from cryptography.x509 import load_pem_x509_certificate
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse

from app.config import AUTH_COOKIE_NAME, JWT_CERT_PATH

router = APIRouter()
logger = logging.getLogger("recipe.auth")


@router.get("/api/auth/me")
def get_me(request: Request):
    auth_token = request.cookies.get(AUTH_COOKIE_NAME)
    if not auth_token:
        logger.warning(
            "SAML auth failed: cookie missing cookie_name=%s received_cookies=%s",
            AUTH_COOKIE_NAME,
            sorted(request.cookies.keys()),
        )
        return _unauthorized("Not authenticated")

    try:
        cert_path = Path(JWT_CERT_PATH)
        cert_pem = cert_path.read_text(encoding="utf-8")
        public_key = load_pem_x509_certificate(cert_pem.encode("utf-8")).public_key()
        payload = jwt.decode(auth_token, public_key, algorithms=["RS256"])
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
        logger.warning(
            "SAML auth failed: invalid token error=%s token_length=%s cert_path=%s",
            exc.__class__.__name__,
            len(auth_token),
            JWT_CERT_PATH,
        )
        return _unauthorized("Invalid token", clear_cookie=True)


@router.get("/api/user/profile")
def get_user_profile(request: Request):
    user = get_user_from_request(request)
    knoxid = _clean_text(user.get("MailAccount"))
    from app.services.user_profile_service import get_user_part
    part = get_user_part(knoxid)
    return {"knoxid": knoxid, "part": part}


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


def get_user_from_request(request: Request) -> dict:
    """JWT 쿠키에서 enriched user payload 추출. 실패 시 빈 dict 반환."""
    try:
        auth_token = request.cookies.get(AUTH_COOKIE_NAME, "")
        if not auth_token:
            return {}
        cert_pem = Path(JWT_CERT_PATH).read_text(encoding="utf-8")
        public_key = load_pem_x509_certificate(cert_pem.encode("utf-8")).public_key()
        payload = jwt.decode(auth_token, public_key, algorithms=["RS256"])
        return _enrich_auth_payload(payload)
    except Exception:
        return {}


def get_actor_from_request(request: Request) -> tuple[str, str]:
    """JWT 쿠키에서 (actor_name, actor_team) 추출. 실패 시 ('', '') 반환."""
    user = get_user_from_request(request)
    return _clean_text(user.get("Username")), _clean_text(user.get("DeptName"))


def _clean_text(value: object) -> str:
    return str(value or "").strip()


def _unauthorized(detail: str, clear_cookie: bool = False) -> JSONResponse:
    response = JSONResponse(status_code=401, content={"detail": detail})
    if clear_cookie:
        response.delete_cookie(AUTH_COOKIE_NAME, path="/")
    return response
