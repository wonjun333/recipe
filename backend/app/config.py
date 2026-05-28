from __future__ import annotations

import os
import re
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

POSTGRES_URL: str = os.getenv('POSTGRES_URL', '')
MONGO_URL: str = os.getenv('MONGO_URL', '')
RECIPE_DATA_DIR: str = os.getenv('RECIPE_DATA_DIR', '')


def _read_mock_mode_from_index_js() -> bool:
    """Nodejs_SAML/index.js의 13번째 줄 MOCK_MODE를 읽어 단일 진실 소스로 사용."""
    try:
        index_js = Path(__file__).resolve().parents[2] / 'Nodejs_SAML' / 'index.js'
        for line in index_js.read_text(encoding='utf-8').splitlines():
            m = re.match(r'\s*var\s+MOCK_MODE\s*=\s*(true|false)', line)
            if m:
                return m.group(1) == 'true'
    except Exception:
        pass
    return os.getenv('MOCK_MODE', 'false').lower() in ('1', 'true', 'yes')


MOCK_MODE: bool = _read_mock_mode_from_index_js()

if not MOCK_MODE:
    _missing = [k for k, v in [('POSTGRES_URL', POSTGRES_URL), ('MONGO_URL', MONGO_URL)] if not v]
    if _missing:
        raise RuntimeError(f"필수 환경변수 누락: {', '.join(_missing)}. .env 파일을 확인하세요.")
