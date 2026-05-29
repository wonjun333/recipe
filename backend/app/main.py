from __future__ import annotations

import os

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.recipe_inventory import router as recipe_inventory_router
from app.api.routes.recipe_test_impl import router as recipe_test_router
from app.routers.ebara import router as ebara_router
from app.settings import recipe_use_mock


def _mock_recipe_units(equipment_id: str | None = None) -> list[dict[str, object]]:
    eqp_id = str(equipment_id or "CMP-A01").strip() or "CMP-A01"
    return [{
        "id": 1,
        "line_name": "LINE-A",
        "team_name": "CMP1",
        "equipment_id": eqp_id,
        "ppid": "MOCK-PPID-001",
        "cas_name": "MAIN.cas",
        "job_name": "STI_CMP_P1.job",
        "unit_recipe_name": "STI_POL_P1_MAIN.pol",
        "ftp_path": rf"\\{eqp_id}\CMPDB\Lcmp\Recipes",
        "is_active": True,
        "created_at": "2026-05-14 00:00:00",
    }]


def create_app() -> FastAPI:
    app = FastAPI(title="Recipe Mock API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(","),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT"],
        allow_headers=["*"],
    )
    app.include_router(ebara_router)
    app.include_router(recipe_test_router, prefix="/api")
    app.include_router(recipe_inventory_router, prefix="/api")

    @app.get("/")
    def root():
        return {"message": "Recipe API is running"}

    @app.get("/api/recipe-units")
    def get_recipe_units(
        equipment_id: str | None = Query(default=None),
        ppid: str | None = Query(default=None),
    ):
        if recipe_use_mock():
            rows = _mock_recipe_units(equipment_id)
            if ppid:
                rows = [row for row in rows if ppid.lower() in str(row.get("ppid") or "").lower()]
            return rows

        sql = """
            SELECT id, line_name, team_name, equipment_id, ppid,
                   cas_name, job_name, unit_recipe_name, ftp_path,
                   is_active, created_at
            FROM core.recipe_unit
            WHERE (%s IS NULL OR equipment_id ILIKE %s)
              AND (%s IS NULL OR ppid ILIKE %s)
            ORDER BY id
            LIMIT 200
        """
        eq_like = f"%{equipment_id}%" if equipment_id else None
        ppid_like = f"%{ppid}%" if ppid else None

        from db import get_conn
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (eq_like, eq_like, ppid_like, ppid_like))
                rows = cur.fetchall()

        return rows

    return app


app = create_app()
