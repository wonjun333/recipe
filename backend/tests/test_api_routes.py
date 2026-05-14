from __future__ import annotations

import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app


client = TestClient(app)


def test_recipe_test_read_routes_are_reachable():
    res = client.get("/api/recipe-test/eqp-options")
    assert res.status_code == 200
    eqp_id = res.json()["eqpOptions"][0]

    load = client.post("/api/recipe-test/load", json={"line": "LINE-A", "team": "CMP1", "eqpId": eqp_id})
    assert load.status_code == 200
    payload = load.json()
    assert payload["eqpId"] == eqp_id
    assert payload["casList"]
    assert payload["jobList"]
    assert payload["recipeList"]

    cas = client.get("/api/recipe-test/cas-content", params={"eqpId": eqp_id, "casId": payload["casList"][0]["name"]})
    assert cas.status_code == 200
    assert cas.json()["casId"] == payload["casList"][0]["name"]

    job = client.get("/api/recipe-test/job-content", params={"eqpId": eqp_id, "jobId": payload["jobList"][0]["id"]})
    assert job.status_code == 200
    assert job.json()["jobId"] == payload["jobList"][0]["id"]

    recipe_source = client.get("/api/recipe-test/recipe-source-list", params={"eqpId": eqp_id, "sourceKind": "polishRecipe"})
    assert recipe_source.status_code == 200
    source_payload = recipe_source.json()
    assert source_payload["sourceKind"] == "polishRecipe"
    assert source_payload["items"]

    recipe = client.get("/api/recipe-test/recipe-content", params={"eqpId": eqp_id, "recipeId": source_payload["items"][0]["id"]})
    assert recipe.status_code == 200
    recipe_payload = recipe.json()["recipe"]
    assert recipe_payload["id"] == source_payload["items"][0]["id"]
    assert recipe_payload["rows"]

    history = client.get("/api/recipe-test/history", params={"limit": 5})
    assert history.status_code == 200
    assert len(history.json()["items"]) == 5

    metrology = client.get("/api/recipe-test/metrology-source-debug", params={"eqpId": eqp_id})
    assert metrology.status_code == 200
    assert metrology.json()["items"]


def test_inventory_snapshot_and_runtime_cache_routes_are_reachable():
    eqp_id = client.get("/api/recipe-test/eqp-options").json()["eqpOptions"][0]

    snapshot = client.get("/api/recipe-inventory/snapshot", params={"eqpId": eqp_id})
    assert snapshot.status_code == 200
    snapshot_payload = snapshot.json()
    assert snapshot_payload["eqpId"] == eqp_id
    assert snapshot_payload["fileCount"] == len(snapshot_payload["items"])
    assert "polishRecipe" in snapshot_payload["sourceLists"]

    invalidate = client.post("/api/recipe-test/invalidate-runtime-cache", json={"eqpId": eqp_id})
    assert invalidate.status_code == 200
    assert invalidate.json() == {"status": "success", "eqpId": eqp_id}
