from __future__ import annotations

import html
import re
from typing import Any

from app.services.pol_con_decoder import build_pol_con_preview_from_bytes

NONE_LABEL = "(None)"
CYAN_BG = "rgb(57, 230, 255)"
GREEN_BG = "rgb(0, 255, 0)"


def _normalize(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def recipe_colon_value(block: str, key: str, default: str = "") -> str:
    pattern = rf"(?m)^\s*{re.escape(key)}\s*:\s*(.*)$"
    match = re.search(pattern, block)
    return match.group(1).strip() if match else default


def format_recipe_unit(value: str, suffix: str) -> str:
    raw = str(value or "").strip()
    return f"{raw}{suffix}" if raw else NONE_LABEL


def format_float_text(value: str, digits: int = 2) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    try:
        return f"{float(raw):.{digits}f}"
    except Exception:
        return raw


def parse_meg_recipe_preview(recipe_id: str, recipe_name: str, modified_at: str, source_kind: str, recipe_text: str) -> dict[str, Any]:
    normalized = _normalize(recipe_text)
    step_matches = list(re.finditer(r"(?ms)^\s*Step\s+(\d+):\s*\n(.*?)(?=^\s*Step\s+\d+:|\Z)", normalized))

    rows: list[dict[str, Any]] = []
    for match in step_matches:
        index = int(match.group(1))
        block = match.group(2)
        rows.append({
            "#": index,
            "Description": recipe_colon_value(block, "Step Comments", NONE_LABEL) or NONE_LABEL,
            "Time": format_recipe_unit(recipe_colon_value(block, "Time", ""), " sec"),
            "Wafer RPM": format_recipe_unit(recipe_colon_value(block, "Wafer RPM", ""), " rpm"),
            "Meg Power": format_recipe_unit(recipe_colon_value(block, "Meg Power", ""), " walts"),
        })

    if not rows:
        rows = [{
            "#": 1,
            "Description": recipe_colon_value(normalized, "Recipe Comments", NONE_LABEL) or NONE_LABEL,
            "Time": NONE_LABEL,
            "Wafer RPM": NONE_LABEL,
            "Meg Power": NONE_LABEL,
        }]

    return {
        "recipe": {
            "id": recipe_id,
            "name": recipe_name,
            "modifiedAt": modified_at,
            "sourceKind": source_kind,
            "columns": ["#", "Description", "Time", "Wafer RPM", "Meg Power"],
            "rows": rows,
        }
    }


def _format_brush_position(pos: str, gap: str) -> str:
    p = str(pos or "").strip()
    g = format_float_text(gap, 2)
    if not p:
        return NONE_LABEL
    if p.lower() == "closed" and g:
        return f"Closed\n{g} mm"
    return p


def _format_diw_to_brushes(onoff: str, rate: str) -> str:
    flag = str(onoff or "").strip().lower()
    flow = format_float_text(rate, 0)
    if flag == "on":
        return f"On\n{flow} ml/min" if flow else "On"
    return "Off"


def _format_dual_spray(onoff: str, rate: str) -> str:
    flag = str(onoff or "").strip().lower()
    flow = format_float_text(rate, 0)
    if flag == "on":
        return f"On\n{flow} ml/min" if flow else "On"
    return "Off"


def _format_spray_flow(block: str) -> str:
    spray_both = str(recipe_colon_value(block, "Spray Both", "")).strip().lower()
    chem1 = format_float_text(recipe_colon_value(block, "Chem 1 Flow Rate", ""), 0)
    chem2 = format_float_text(recipe_colon_value(block, "Chem 2 Flow Rate", ""), 0)
    diw = format_float_text(recipe_colon_value(block, "DIW Spray Flow Rate", ""), 0)

    if spray_both in {"diw", "water"}:
        return f"DIW only: {diw} ml/min" if diw else "DIW only"
    if spray_both in {"chema", "chem 1", "chem1"}:
        return f"Chem 1 only: {chem1} ml/min" if chem1 else "Chem 1 only"
    if spray_both in {"chemb", "chem 2", "chem2"}:
        return f"Chem 2 only: {chem2} ml/min" if chem2 else "Chem 2 only"
    if chem1 and chem2:
        return f"Chem 1: {chem1} ml/min / Chem 2: {chem2} ml/min"
    if chem1:
        return f"Chem 1 only: {chem1} ml/min"
    if chem2:
        return f"Chem 2 only: {chem2} ml/min"
    if diw:
        return f"DIW only: {diw} ml/min"
    return "Off"


def parse_br_recipe_preview(recipe_id: str, recipe_name: str, modified_at: str, source_kind: str, recipe_text: str) -> dict[str, Any]:
    normalized = _normalize(recipe_text)
    step_matches = list(re.finditer(r"(?ms)^\s*Step\s+(\d+):\s*\n(.*?)(?=^\s*Step\s+\d+:|\Z)", normalized))

    rows: list[dict[str, Any]] = []
    for match in step_matches:
        block = match.group(2)
        rows.append({
            "Description": recipe_colon_value(block, "Step Comments", NONE_LABEL) or NONE_LABEL,
            "Time": recipe_colon_value(block, "Time", NONE_LABEL) or NONE_LABEL,
            "Brush RPM": format_recipe_unit(recipe_colon_value(block, "Brush RPM", ""), " rpm"),
            "Brush Position": _format_brush_position(
                recipe_colon_value(block, "Brush Pos", ""),
                recipe_colon_value(block, "Brush Gap", ""),
            ),
            "Wafer RPM": format_recipe_unit(recipe_colon_value(block, "Wafer RPM", ""), " rpm"),
            "DIW to Brushes": _format_diw_to_brushes(
                recipe_colon_value(block, "DI Water On/Off", ""),
                recipe_colon_value(block, "DIW Brush Flow Rate", ""),
            ),
            "Spray Bar Flow Settings": _format_spray_flow(block),
            "DIW to Dual Spray Bars": _format_dual_spray(
                recipe_colon_value(block, "DIW Dual Spray On/Off", ""),
                recipe_colon_value(block, "DIW Dual Spray Flow Rate", ""),
            ),
        })

    if not rows:
        rows = [{
            "Description": recipe_colon_value(normalized, "Recipe Comments", NONE_LABEL) or NONE_LABEL,
            "Time": NONE_LABEL,
            "Brush RPM": NONE_LABEL,
            "Brush Position": NONE_LABEL,
            "Wafer RPM": NONE_LABEL,
            "DIW to Brushes": NONE_LABEL,
            "Spray Bar Flow Settings": NONE_LABEL,
            "DIW to Dual Spray Bars": NONE_LABEL,
        }]

    return {
        "recipe": {
            "id": recipe_id,
            "name": recipe_name,
            "modifiedAt": modified_at,
            "sourceKind": source_kind,
            "columns": [
                "Description",
                "Time",
                "Brush RPM",
                "Brush Position",
                "Wafer RPM",
                "DIW to Brushes",
                "Spray Bar Flow Settings",
                "DIW to Dual Spray Bars",
            ],
            "rows": rows,
        }
    }


def parse_dryr_recipe_preview(recipe_id: str, recipe_name: str, modified_at: str, source_kind: str, recipe_text: str) -> dict[str, Any]:
    normalized = _normalize(recipe_text)
    step1 = re.search(r"(?ms)^\s*Step\s+1:\s*\n(.*?)(?=^\s*Step\s+\d+:|\Z)", normalized)
    block = step1.group(1) if step1 else normalized

    ipa = recipe_colon_value(block, "IPA Flow", "")
    carrier = recipe_colon_value(block, "Vapor Carrier Flow", "")
    motion_index = recipe_colon_value(block, "Motion Index", "")

    motion_profile = NONE_LABEL
    if motion_index.strip():
        try:
            motion_profile = f"Up Block Profile {int(float(motion_index)) + 1}"
        except Exception:
            motion_profile = f"Up Block Profile {motion_index}"

    rows = [
        {"Item": "IPA Flow", "Value": f"{ipa} g/m" if ipa else NONE_LABEL},
        {"Item": "N2 Vapor Carrier Flow", "Value": f"{carrier} slm" if carrier else NONE_LABEL},
        {"Item": "Motion Profile", "Value": motion_profile},
    ]

    return {
        "recipe": {
            "id": recipe_id,
            "name": recipe_name,
            "modifiedAt": modified_at,
            "sourceKind": source_kind,
            "columns": ["Item", "Value"],
            "rows": rows,
        }
    }


def _decode_recipe_bytes_to_text(recipe_bytes: bytes) -> str:
    for enc in ("utf-8", "cp949", "euc-kr", "latin1"):
        try:
            return recipe_bytes.decode(enc)
        except Exception:
            continue
    return recipe_bytes.decode("utf-8", errors="replace")


def create_no_preview_recipe(recipe_id: str, recipe_name: str, modified_at: str, source_kind: str) -> dict[str, Any]:
    return {
        "recipe": {
            "id": recipe_id,
            "name": recipe_name,
            "modifiedAt": modified_at,
            "sourceKind": source_kind,
            "columns": [],
            "rows": [],
            "meta": {"message": "Preview not available for this file type."},
        }
    }


def build_recipe_preview_from_bytes(recipe_id: str, recipe_name: str, modified_at: str, source_kind: str, recipe_bytes: bytes, preview_context: dict[str, Any] | None = None) -> dict[str, Any] | None:
    lower_name = recipe_name.lower()

    if lower_name.endswith('.pol') or lower_name.endswith('.con'):
        return build_pol_con_preview_from_bytes(recipe_id, recipe_name, modified_at, source_kind, recipe_bytes, preview_context)

    if lower_name.endswith('.alg') or lower_name.endswith('.seg') or lower_name.endswith('.scx'):
        return create_no_preview_recipe(recipe_id, recipe_name, modified_at, source_kind)

    if source_kind == 'megasonics' or lower_name.endswith('.meg'):
        return parse_meg_recipe_preview(recipe_id, recipe_name, modified_at, source_kind, _decode_recipe_bytes_to_text(recipe_bytes))
    if source_kind in {"brush1", "brush2"} or lower_name.endswith('.br'):
        return parse_br_recipe_preview(recipe_id, recipe_name, modified_at, source_kind, _decode_recipe_bytes_to_text(recipe_bytes))
    if source_kind == 'vaporDryer' or lower_name.endswith('.dryr') or lower_name.endswith('.drpr'):
        return parse_dryr_recipe_preview(recipe_id, recipe_name, modified_at, source_kind, _decode_recipe_bytes_to_text(recipe_bytes))

    return None


def build_source_recipe_preview(recipe_id: str, recipe_name: str, modified_at: str, source_kind: str, recipe_text: str) -> dict[str, Any] | None:
    if source_kind == "megasonics":
        return parse_meg_recipe_preview(recipe_id, recipe_name, modified_at, source_kind, recipe_text)
    if source_kind in {"brush1", "brush2"}:
        return parse_br_recipe_preview(recipe_id, recipe_name, modified_at, source_kind, recipe_text)
    if source_kind == "vaporDryer":
        return parse_dryr_recipe_preview(recipe_id, recipe_name, modified_at, source_kind, recipe_text)
    return None
