from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

POSTGRES_URL: str = os.getenv('POSTGRES_URL', '')
MONGO_URL: str = os.getenv('MONGO_URL', '')
RECIPE_DATA_DIR: str = os.getenv('RECIPE_DATA_DIR', '')
MOCK_MODE: bool = os.getenv('MOCK_MODE', 'false').lower() in ('1', 'true', 'yes')
AUTH_MODE: str = os.getenv('AUTH_MODE', 'mock').lower()
AUTH_COOKIE_NAME: str = os.getenv('AUTH_COOKIE_NAME', 'auth_token')
JWT_CERT_PATH: str = os.getenv('JWT_CERT_PATH', '../Nodejs_SAML/cert/cert.pem')

if not MOCK_MODE:
    _missing = [k for k, v in [('POSTGRES_URL', POSTGRES_URL), ('MONGO_URL', MONGO_URL)] if not v]
    if _missing:
        raise RuntimeError(f"필수 환경변수 누락: {', '.join(_missing)}. .env 파일을 확인하세요.")
