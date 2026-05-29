from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / '.env')
except Exception:
    pass

COOKIE_NAME = 'auth_token'
COOKIE_SECURE: bool = os.environ.get('AUTH_COOKIE_SECURE', 'false').lower() == 'true'

# JWT 검증: JWT_PUBLIC_CERT_PATH 설정 시 RS256(cert.pem), 미설정 시 HS256(AUTH_JWT_SECRET)
JWT_PUBLIC_CERT_PATH: str = os.environ.get('JWT_PUBLIC_CERT_PATH', '')
JWT_SECRET: str = os.environ.get('AUTH_JWT_SECRET', '')


def _normalize_user(payload: dict) -> dict:
    """Node.js JWT(대문자 키) → 소문자 camelCase 정규화."""
    result = {}
    for k, v in payload.items():
        if k == 'exp':
            continue
        normalized = k[0].lower() + k[1:] if k[0].isupper() else k
        result[normalized] = v
    return result


def verify_jwt(token: str) -> dict:
    import jwt
    if JWT_PUBLIC_CERT_PATH:
        pub_key = Path(JWT_PUBLIC_CERT_PATH).read_text(encoding='utf-8')
        payload = jwt.decode(token, pub_key, algorithms=['RS256'])
    else:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    return _normalize_user(payload)
