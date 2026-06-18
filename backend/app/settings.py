from __future__ import annotations

import os


def env_flag(name: str, default: bool = False) -> bool:
    value = str(os.getenv(name, "")).strip().lower()
    if not value:
        return default
    return value in {"1", "true", "yes", "on"}


def mongo_url() -> str:
    return os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017/")


def postgres_url() -> str:
    return os.getenv("POSTGRES_URL", "")
