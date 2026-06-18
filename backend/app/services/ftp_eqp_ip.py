from __future__ import annotations

from app.config import MONGO_URL, POSTGRES_URL

_pg_engine = None
_mongo_client = None


def _get_pg_engine():
    global _pg_engine
    if _pg_engine is None:
        from sqlalchemy import create_engine
        _pg_engine = create_engine(POSTGRES_URL, pool_pre_ping=True)
    return _pg_engine


def _get_mongo_client():
    global _mongo_client
    if _mongo_client is None:
        from pymongo import MongoClient
        _mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
    return _mongo_client


def load_lk_model_eqps(limit: int | None = None) -> list[dict[str, str]]:
    from sqlalchemy import text

    query = text(
        """
        SELECT
          COALESCE(s.site, '') AS line,
          COALESCE(e.sdwt_name, '') AS team,
          e.eqp_id AS eqp_id,
          e.eqp_model AS model,
          e.maker_name AS maker,
          e.eqp_model_bucket AS model_group
        FROM public.eqp_info e
        INNER JOIN public.sdwt_info s
          ON e.sdwt_name = s.sdwt_name
        WHERE e.prc_group IS NOT NULL
          AND LOWER(COALESCE(e.eqp_model_bucket, '')) = 'lk_model'
        ORDER BY e.eqp_id
        """
    )

    with _get_pg_engine().connect() as conn:
        rows = conn.execute(query).mappings().all()

    items = [
        {
            "line": str(r.get("line") or "").strip(),
            "team": str(r.get("team") or "").strip(),
            "eqpId": str(r.get("eqp_id") or "").strip(),
            "model": str(r.get("model") or "").strip(),
            "maker": str(r.get("maker") or "").strip(),
            "modelGroup": str(r.get("model_group") or "").strip(),
        }
        for r in rows
        if str(r.get("eqp_id") or "").strip()
    ]
    return items[:limit] if limit and limit > 0 else items


def load_eqp_ftp_credentials(eqp_id: str) -> dict[str, str]:
    doc = _get_mongo_client()["ADDCMP"]["FTP_STATUS"].find_one(
        {"EQPID": eqp_id},
        {"_id": 0, "FTP_SERVER": 1, "FTP_ID": 1, "FTP_PW": 1},
    )
    if not doc:
        raise ValueError(f"FTP credential not found for EQPID={eqp_id}")

    host = str(doc.get("FTP_SERVER") or "").strip()
    user = str(doc.get("FTP_ID") or "").strip()
    password = str(doc.get("FTP_PW") or "")
    if not host or not user:
        raise ValueError(f"Incomplete FTP credential for EQPID={eqp_id}")

    return {"host": host, "user": user, "password": password}
