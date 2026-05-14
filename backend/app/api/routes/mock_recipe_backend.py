from __future__ import annotations

import copy
import hashlib
import importlib.util
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from app.services.recipe_preview_service import build_source_recipe_preview, create_no_preview_recipe

NONE_LABEL = "(None)"

SOURCE_KIND_DEFAULTS: dict[str, dict[str, Any]] = {
    "recipe": {"titleBase": "Recipe", "path": "/equipment/{eqpId}/recipes", "exts": [".rcp"]},
    "polishRecipe": {"titleBase": "Polish Recipe", "path": "/equipment/{eqpId}/polish", "exts": [".pol"]},
    "conditionRecipe": {"titleBase": "Condition Recipe", "path": "/equipment/{eqpId}/condition", "exts": [".con"]},
    "exSituCondition": {"titleBase": "Ex Situ Condition", "path": "/equipment/{eqpId}/condition", "exts": [".con"]},
    "specialExSitu": {"titleBase": "Special Ex Situ", "path": "/equipment/{eqpId}/condition", "exts": [".con"]},
    "isrmAlgorithm": {"titleBase": "ISRM Algorithm", "path": "/equipment/{eqpId}/isrm", "exts": [".alg"]},
    "rtpcRecipe": {"titleBase": "RTPC Recipe", "path": "/equipment/{eqpId}/rtpc", "exts": [".rcp"]},
    "hcluPostLoad": {"titleBase": "HCLU Post-Load", "path": "/equipment/{eqpId}/hclu", "exts": [".rcp"]},
    "hcluPreUnload": {"titleBase": "HCLU Pre-Unload", "path": "/equipment/{eqpId}/hclu", "exts": [".rcp"]},
    "megasonics": {"titleBase": "Megasonics", "path": "/equipment/{eqpId}/cleaner/meg", "exts": [".meg"]},
    "brush1": {"titleBase": "Brush 1", "path": "/equipment/{eqpId}/cleaner/br1", "exts": [".br"]},
    "brush2": {"titleBase": "Brush 2", "path": "/equipment/{eqpId}/cleaner/br2", "exts": [".br"]},
    "vaporDryer": {"titleBase": "Vapor Dryer", "path": "/equipment/{eqpId}/cleaner/dryer", "exts": [".dryr", ".drpr"]},
    "metrologyRecipe": {"titleBase": "Metrology Recipe", "path": "/equipment/{eqpId}/metrology", "exts": [".rcp"]},
}


def _mockup_data_path() -> Path:
    return Path(__file__).resolve().parents[3] / "tests" / "mockup_data.py"


def load_mockup_data() -> Any:
    path = _mockup_data_path()
    spec = importlib.util.spec_from_file_location("recipe_backend_mockup_data", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load mock data from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def deepcopy_data(value: Any) -> Any:
    return copy.deepcopy(value)


def require_known_eqp_id(eqp_id: str) -> str:
    eqp_id = str(eqp_id or "").strip()
    md = load_mockup_data()
    if eqp_id not in set(md.MOCK_EQP_OPTIONS.get("eqpOptions", [])):
        raise HTTPException(status_code=404, detail=f"Unknown equipment: {eqp_id}")
    return eqp_id


def get_eqp_meta(eqp_id: str) -> dict[str, Any]:
    eqp_id = require_known_eqp_id(eqp_id)
    md = load_mockup_data()
    item = next((x for x in md.MOCK_EQP_OPTIONS["items"] if x.get("eqpId") == eqp_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Missing equipment metadata for: {eqp_id}")
    return deepcopy_data(item)


def get_source_list(source_kind: str, eqp_id: str) -> dict[str, Any]:
    eqp_id = require_known_eqp_id(eqp_id)
    source_kind = str(source_kind or "").strip()
    defaults = SOURCE_KIND_DEFAULTS.get(source_kind)
    if defaults is None:
        raise HTTPException(status_code=404, detail=f"Unknown source kind: {source_kind}")

    md = load_mockup_data()
    source = deepcopy_data(md.MOCK_RECIPE_SOURCE_LIST.get(source_kind))
    if source is None:
        source = {
            "sourceKind": source_kind,
            "titleBase": defaults["titleBase"],
            "path": defaults["path"].format(eqpId=eqp_id),
            "exts": list(defaults["exts"]),
            "items": [],
        }
    else:
        source["path"] = defaults["path"].format(eqpId=eqp_id)
    return source


def build_load_response(eqp_id: str) -> dict[str, Any]:
    eqp_meta = get_eqp_meta(eqp_id)
    md = load_mockup_data()

    recipe_items: list[dict[str, Any]] = []
    seen_recipe_ids: set[str] = set()
    for source_kind in SOURCE_KIND_DEFAULTS:
        source = get_source_list(source_kind, eqp_id)
        for item in source["items"]:
            recipe_id = str(item.get("id") or "").strip()
            if not recipe_id or recipe_id in seen_recipe_ids:
                continue
            seen_recipe_ids.add(recipe_id)
            recipe_items.append(
                {
                    "id": recipe_id,
                    "name": str(item.get("name") or ""),
                    "modifiedAt": str(item.get("modifiedAt") or ""),
                }
            )

    cas_to_jobs = {
        cas_name: list(deepcopy_data(content.get("jobIds") or []))
        for cas_name, content in md.MOCK_CAS_CONTENT.items()
    }

    return {
        "eqpId": eqp_id,
        "meta": {
            **eqp_meta,
            "mock": True,
            "source": "tests/mockup_data.py",
        },
        "casList": deepcopy_data(md.MOCK_CAS_LIST),
        "jobList": deepcopy_data(md.MOCK_JOB_LIST),
        "recipeList": recipe_items,
        "casToJobs": cas_to_jobs,
    }


def get_cas_content(cas_id: str) -> dict[str, Any]:
    md = load_mockup_data()
    cas_id = str(cas_id or "").strip()
    content = md.MOCK_CAS_CONTENT.get(cas_id)
    if content is None:
        raise HTTPException(status_code=404, detail=f"CAS not found: {cas_id}")
    return deepcopy_data(content)


def get_job_content(job_id: str) -> dict[str, Any]:
    md = load_mockup_data()
    job_id = str(job_id or "").strip()
    content = md.MOCK_JOB_CONTENT.get(job_id)
    if content is None:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return deepcopy_data(content)


def find_recipe_item(eqp_id: str, recipe_id_or_name: str) -> dict[str, Any]:
    recipe_id_or_name = str(recipe_id_or_name or "").strip()
    require_known_eqp_id(eqp_id)
    if not recipe_id_or_name:
        raise HTTPException(status_code=400, detail="recipeId is required")

    for source_kind in SOURCE_KIND_DEFAULTS:
        source = get_source_list(source_kind, eqp_id)
        for item in source["items"]:
            if recipe_id_or_name in {str(item.get("id") or "").strip(), str(item.get("name") or "").strip()}:
                result = deepcopy_data(item)
                result["sourceKind"] = source_kind
                result["titleBase"] = source.get("titleBase", SOURCE_KIND_DEFAULTS[source_kind]["titleBase"])
                result["path"] = source.get("path", SOURCE_KIND_DEFAULTS[source_kind]["path"].format(eqpId=eqp_id))
                return result

    raise HTTPException(status_code=404, detail=f"Recipe not found: {recipe_id_or_name}")


def _simple_recipe_rows(recipe_name: str, source_kind: str) -> list[dict[str, Any]]:
    stem = Path(recipe_name).stem
    tokens = [token for token in stem.replace("-", "_").split("_") if token]
    return [
        {"Field": "Source Kind", "Value": source_kind or "recipe"},
        {"Field": "Recipe Name", "Value": recipe_name},
        {"Field": "Family", "Value": tokens[0] if tokens else NONE_LABEL},
        {"Field": "Stage", "Value": tokens[1] if len(tokens) > 1 else NONE_LABEL},
        {"Field": "Platen", "Value": next((token for token in tokens if token.upper().startswith("P")), NONE_LABEL)},
    ]


def build_recipe_content(eqp_id: str, recipe_id_or_name: str) -> dict[str, Any]:
    item = find_recipe_item(eqp_id, recipe_id_or_name)
    recipe_id = str(item.get("id") or "")
    recipe_name = str(item.get("name") or "")
    modified_at = str(item.get("modifiedAt") or "")
    source_kind = str(item.get("sourceKind") or "recipe")

    preview = build_source_recipe_preview(
        recipe_id=recipe_id,
        recipe_name=recipe_name,
        modified_at=modified_at,
        source_kind=source_kind,
        recipe_text="",
    )
    if preview is None:
        preview = create_no_preview_recipe(recipe_id, recipe_name, modified_at, source_kind)

    recipe = dict(preview.get("recipe") or {})
    if not recipe.get("columns"):
        recipe["columns"] = ["Field", "Value"]
    if not recipe.get("rows"):
        recipe["rows"] = _simple_recipe_rows(recipe_name, source_kind)
    recipe["id"] = recipe_id
    recipe["name"] = recipe_name
    recipe["modifiedAt"] = modified_at
    recipe["sourceKind"] = source_kind
    return {"recipe": recipe}


def build_metrology_debug(eqp_id: str) -> dict[str, Any]:
    require_known_eqp_id(eqp_id)
    md = load_mockup_data()
    items: list[dict[str, Any]] = []
    for job in md.MOCK_JOB_CONTENT.values():
        parsed = job.get("parsed") or {}
        items.append(
            {
                "jobId": str(job.get("jobId") or ""),
                "jobName": str(job.get("jobName") or ""),
                "preMetrology": deepcopy_data(parsed.get("preMetrology") or {}),
                "postMetrology": deepcopy_data(parsed.get("postMetrology") or {}),
            }
        )
    return {"eqpId": eqp_id, "items": items, "mock": True}


def build_inventory_snapshot(eqp_id: str) -> dict[str, Any]:
    require_known_eqp_id(eqp_id)
    items: list[dict[str, Any]] = []
    source_lists: dict[str, list[dict[str, Any]]] = {}
    source_titles: dict[str, str] = {}

    for source_kind in SOURCE_KIND_DEFAULTS:
        source = get_source_list(source_kind, eqp_id)
        source_titles[source_kind] = str(source.get("titleBase") or SOURCE_KIND_DEFAULTS[source_kind]["titleBase"])
        source_items: list[dict[str, Any]] = []
        for item in source["items"]:
            snapshot_item = {
                "id": str(item.get("id") or ""),
                "name": str(item.get("name") or ""),
                "modifiedAt": str(item.get("modifiedAt") or ""),
                "sourceKind": source_kind,
                "ext": str(item.get("ext") or ""),
                "livePresent": True,
                "cached": False,
            }
            items.append(snapshot_item)
            source_items.append(snapshot_item)
        source_lists[source_kind] = source_items

    digest_input = "|".join(
        f"{item['sourceKind']}:{item['id']}:{item['modifiedAt']}:{item['name']}"
        for item in sorted(items, key=lambda x: (x["sourceKind"], x["name"], x["id"]))
    )
    snapshot_hash = hashlib.sha256(digest_input.encode("utf-8")).hexdigest()[:16]
    return {
        "eqpId": eqp_id,
        "snapshotHash": snapshot_hash,
        "fileCount": len(items),
        "items": items,
        "sourceLists": source_lists,
        "sourceTitles": source_titles,
    }
