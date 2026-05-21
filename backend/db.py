import os
import psycopg
from psycopg.rows import dict_row

def get_conn():
    password = os.getenv("DB_PASSWORD")
    if password is None:
        raise RuntimeError("필수 환경변수 누락: DB_PASSWORD. .env 파일을 확인하세요.")
    return psycopg.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER", "postgres"),
        password=password,
        row_factory=dict_row,
    )
