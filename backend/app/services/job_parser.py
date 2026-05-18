from __future__ import annotations

import re
from typing import Any

NONE_LABEL = "(None)"

STATION_LABELS = {
    "CIN": "Cleaner Input",
    "BR1": "Brush 1",
    "BR2": "Brush 2",
    "DRYER": "Vapor Dryer",
    "MEG": "Megasonics",
    "COUT": "Cleaner Output",
}

def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")

def extract_section(job_text: str, section_name: str) -> str:
    text = normalize_newlines(job_text)
    m = re.search(
        rf"(?ms)^\[{re.escape(section_name)}\]\n(.*?)(?=^\[|\Z)",
        text
    )
    return m.group(1) if m else ""

def section_value(section_text: str, key: str, default: str = "") -> str:
    # key=value 형태를 줄 단위로 안전하게 추출
    m = re.search(
        rf"(?m)^{re.escape(key)}=(.*)$",
        section_text
    )
    return m.group(1).strip() if m else default

def bool_from_text(value: str) -> bool:
    return str(value or "").strip().upper() == "TRUE"

def normalize_job_field(value: str, zero_is_none: bool = False) -> str:
    v = str(value or "").strip()
    if v == "" or v == "(None)" or (zero_is_none and v == "0"):
        return NONE_LABEL
    return v

def parse_job_text(job_text: str) -> dict[str, Any]:
    """
    .job 파일을 프런트가 바로 쓰기 좋은 구조로 파싱한다.
    """
    text = normalize_newlines(job_text)

    pre_met = extract_section(text, "Pre-Metrology")
    polisher = extract_section(text, "Polisher")
    cleaner = extract_section(text, "Cleaner")
    post_met = extract_section(text, "Post-Metrology")

    pre_enabled = bool_from_text(section_value(pre_met, "Do Pre Metrology", "FALSE"))
    pre_recipe = normalize_job_field(section_value(pre_met, "Recipe", "(None)"))

    post_enabled = bool_from_text(section_value(post_met, "Do Post Metrology", "FALSE"))
    post_recipe = normalize_job_field(section_value(post_met, "Recipe", "(None)"))

    route_to_polisher = bool_from_text(section_value(polisher, "Route to Polisher", "FALSE"))
    route_to_cleaner = bool_from_text(section_value(cleaner, "Route to Cleaner", "FALSE"))

    row_defs = [
        ("Polish Recipe", "Polish Recipe", False),
        ("Condition Recipe", "Condition Recipe", False),
        ("Ex Situ Condition", "Ex Situ Condition Recipe", False),
        ("Special Ex Situ", "Ex Situ Conditioning Optimization", True),   # 0 => (None)
        ("ISRM Algorithm", "ISRM Algorithm", False),
        ("WL Algorithm", "WL Algorithm", False),
        ("RTPC Recipe", "RTPC Recipe", False),                            # 없으면 fallback
        ("PRC Algorithm", "PRC Algorithm", False),
        ("FT Algorithm", "FT Algorithm", False),                          # 빈칸 => (None)
    ]

    platen_rows: list[dict[str, str]] = []
    for row_label, key_name, zero_is_none in row_defs:
        row = {"label": row_label, "p1": NONE_LABEL, "p2": NONE_LABEL, "p3": NONE_LABEL}

        for platen in (1, 2, 3):
            value = section_value(polisher, f"Platen {platen} {key_name}", "")

            # 제공 예시에는 RTPC Recipe 키가 없고 ICMP Algorithm만 있으므로 fallback
            if row_label == "RTPC Recipe" and not value:
                value = section_value(polisher, f"Platen {platen} ICMP Algorithm", "")

            row[f"p{platen}"] = normalize_job_field(value, zero_is_none=zero_is_none)

        platen_rows.append(row)

    number_of_steps_raw = section_value(cleaner, "Number of Steps", "0")
    number_of_steps = int(number_of_steps_raw) if number_of_steps_raw.isdigit() else 0

    cleaner_rows: list[dict[str, str]] = []
    for i in range(number_of_steps):
        station_id = section_value(cleaner, f"Step {i} Station ID", "")
        recipe = normalize_job_field(section_value(cleaner, f"Step {i} Recipe", ""))

        cleaner_rows.append({
            "index": STATION_LABELS.get(station_id, station_id or f"Step {i}"),
            "module": station_id or NONE_LABEL,
            "recipe": recipe,
        })

    return {
        "preMetrology": {
            "enabled": pre_enabled,
            "recipe": pre_recipe,
        },
        "polisher": {
            "route": route_to_polisher,
            "rows": platen_rows,
        },
        "cleaner": {
            "route": route_to_cleaner,
            "numberOfSteps": number_of_steps,
            "rows": cleaner_rows,
        },
        "postMetrology": {
            "enabled": post_enabled,
            "recipe": post_recipe,
        },
    }