from fastapi import FastAPI, Query
from db import get_conn

app = FastAPI(title="Recipe Mock API")


@app.get("/")
def root():
    return {"message": "Recipe API is running"}


@app.get("/api/recipe-units")
def get_recipe_units(
    equipment_id: str | None = Query(default=None),
    ppid: str | None = Query(default=None),
):
    sql = """
        SELECT
            id,
            line_name,
            team_name,
            equipment_id,
            ppid,
            cas_name,
            job_name,
            unit_recipe_name,
            ftp_path,
            is_active,
            created_at
        FROM core.recipe_unit
        WHERE (%s IS NULL OR equipment_id ILIKE %s)
          AND (%s IS NULL OR ppid ILIKE %s)
        ORDER BY id
        LIMIT 200
    """

    eq_like = f"%{equipment_id}%" if equipment_id else None
    ppid_like = f"%{ppid}%" if ppid else None

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (eq_like, eq_like, ppid_like, ppid_like))
            rows = cur.fetchall()

    return rows
