from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

POSTGRES_URL: str = os.getenv('POSTGRES_URL', '')
MONGO_URL: str = os.getenv('MONGO_URL', 'mongodb://127.0.0.1:27017/')
