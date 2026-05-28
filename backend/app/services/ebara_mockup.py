"""
Ebara CMP 설비 mockup 데이터.
레시피 포맷: 텍스트 기반 CSV (Item,Unit,Data) — AMAT binary .pol 방식과 다름.
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Equipment list (EBARA maker, AMAT과 line/team 공유 but eqpId 별도)
# ---------------------------------------------------------------------------

EBARA_EQP_LIST: list[dict[str, str]] = [
    {"line": "LINE-A", "team": "CMP1", "eqpId": "EBR-A101", "model": "F-REX200S", "maker": "EBARA"},
    {"line": "LINE-A", "team": "CMP1", "eqpId": "EBR-A102", "model": "F-REX200S", "maker": "EBARA"},
    {"line": "LINE-A", "team": "CMP2", "eqpId": "EBR-A201", "model": "F-REX300", "maker": "EBARA"},
    {"line": "LINE-A", "team": "CMP2", "eqpId": "EBR-A202", "model": "F-REX300", "maker": "EBARA"},
    {"line": "LINE-B", "team": "CMP1", "eqpId": "EBR-B101", "model": "F-REX200S", "maker": "EBARA"},
    {"line": "LINE-B", "team": "CMP1", "eqpId": "EBR-B102", "model": "F-REX200S", "maker": "EBARA"},
    {"line": "LINE-B", "team": "CMP2", "eqpId": "EBR-B201", "model": "F-REX300", "maker": "EBARA"},
    {"line": "LINE-B", "team": "CMP2", "eqpId": "EBR-B202", "model": "F-REX300", "maker": "EBARA"},
]

# ---------------------------------------------------------------------------
# Recipe parameter definitions (Item, Unit)
# ---------------------------------------------------------------------------

_PARAMS: list[tuple[str, str]] = [
    ("ProcessTime",      "s"),
    ("TableSpeed",       "rpm"),
    ("HeadSpeed",        "rpm"),
    ("Zone1Pressure",    "psi"),
    ("Zone2Pressure",    "psi"),
    ("Zone3Pressure",    "psi"),
    ("Zone4Pressure",    "psi"),
    ("BackPressure",     "psi"),
    ("SlurryFlowA",      "mL/min"),
    ("SlurryFlowB",      "mL/min"),
    ("DIFlow",           "mL/min"),
    ("PolishEndpoint",   ""),
    ("OverPolish",       "%"),
    ("ConditionerEnable",""),
    ("ConditionFreq",    "wafer"),
    ("RinseTime",        "s"),
]

_PROCS  = ["OXIDE", "METAL", "STI", "POLY", "CU"]
_MODES  = ["STD", "FAST", "PRO"]
_DATES  = [
    "25-01-10 09:00AM", "25-02-05 10:30AM", "25-03-03 14:00PM",
    "25-03-19 08:30AM", "25-04-09 15:30PM", "25-04-17 11:00AM",
    "25-05-02 13:00PM", "25-05-14 09:30AM", "25-05-21 16:00PM",
    "25-05-28 10:00AM", "25-05-28 11:00AM", "25-05-28 14:00PM",
    "25-05-28 15:00PM", "25-05-28 16:30PM", "25-05-28 08:00AM",
]


def _dt(idx: int) -> str:
    return _DATES[idx % len(_DATES)]


def _make_recipe_text(proc: str, mode_idx: int) -> str:
    """각 공정/모드 조합의 레시피 텍스트 생성 (Item,Unit,Data CSV)."""
    base = {
        "OXIDE":  [60, 90, 85, 4.5, 4.0, 3.5, 3.0, 1.5, 200, 100, 300, "TIMER", 10, "ON", 2, 10],
        "METAL":  [50, 85, 80, 4.0, 3.5, 3.0, 2.5, 1.2, 180, 90,  250, "TIMER", 8,  "ON", 3, 8],
        "STI":    [70, 95, 90, 5.0, 4.5, 4.0, 3.5, 1.8, 220, 110, 320, "TIMER", 12, "ON", 2, 12],
        "POLY":   [45, 80, 75, 3.5, 3.0, 2.5, 2.0, 1.0, 160, 80,  220, "TIMER", 8,  "OFF", 0, 8],
        "CU":     [55, 88, 82, 4.2, 3.8, 3.2, 2.8, 1.3, 190, 95,  280, "TIMER", 9,  "ON", 3, 10],
    }.get(proc, [60, 90, 85, 4.5, 4.0, 3.5, 3.0, 1.5, 200, 100, 300, "TIMER", 10, "ON", 2, 10])

    # mode 조정
    adjustments = [
        [0] * len(base),                                        # STD: 그대로
        [-5, 5, 5, -0.3, -0.3, -0.3, -0.3, 0, 20, 10, 30, 0, -2, 0, -1, -2],  # FAST
        [10, -3, -3, 0.4, 0.4, 0.4, 0.4, 0.2, -10, -5, -20, 0, 2, 0, 1, 3],  # PRO
    ]
    adj = adjustments[min(mode_idx, 2)]
    rows = []
    for i, (item, unit) in enumerate(_PARAMS):
        base_val = base[i]
        if isinstance(base_val, str):
            rows.append(f"{item},{unit},{base_val}")
        else:
            delta = adj[i] if i < len(adj) else 0
            val = round(base_val + delta, 2)
            rows.append(f"{item},{unit},{val}")
    return "\n".join(rows)


# 모든 레시피 내용 사전 생성 (key: recipe file name)
EBARA_RECIPE_CONTENTS: dict[str, str] = {}
for _proc in _PROCS:
    for _j, _mode in enumerate(_MODES):
        _name = f"{_proc}_{_mode}.rcp"
        EBARA_RECIPE_CONTENTS[_name] = _make_recipe_text(_proc, _j)

# 설비별 레시피 목록 (모든 설비 동일, 실제에서는 설비별로 다름)
EBARA_RECIPE_FILE_LIST: list[dict[str, str]] = [
    {"name": f"{proc}_{mode}.rcp", "modifiedAt": _dt(i * 3 + j), "size": "512"}
    for i, proc in enumerate(_PROCS)
    for j, mode in enumerate(_MODES)
]  # 15 items


def decode_ebara_recipe(text: str) -> list[dict[str, str]]:
    """Ebara 레시피 텍스트 (Item,Unit,Data CSV) → row 리스트."""
    rows = []
    for line in text.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split(",", 2)
        rows.append({
            "item": parts[0] if len(parts) > 0 else "",
            "unit": parts[1] if len(parts) > 1 else "",
            "data": parts[2] if len(parts) > 2 else "",
        })
    return rows


def encode_ebara_recipe(rows: list[dict[str, str]]) -> str:
    """row 리스트 → 레시피 텍스트."""
    return "\n".join(f"{r['item']},{r['unit']},{r['data']}" for r in rows)
