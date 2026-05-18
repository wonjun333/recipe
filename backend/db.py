import os
import psycopg
from psycopg.rows import dict_row

def get_conn():
    return psycopg.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "postgres"),   # recipe_prod면 바꿔주세요
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),     # 비밀번호 있으면 넣기
        row_factory=dict_row,
    )