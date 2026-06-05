"""
Mockup data used when MOCK_MODE=true.
Mimics the shape returned by real PostgreSQL (equipment list),
MongoDB (FTP credentials), and FTP file listings/contents.

To switch to real DB/FTP: set MOCK_MODE=false (or remove it) in .env.
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Equipment list  (PostgreSQL mockup)
# ---------------------------------------------------------------------------

MOCK_EQP_LIST: list[dict[str, str]] = [
    {"line": "LINE-A", "team": "CMP1", "eqpId": "CMP-A101", "model": "REFLEXION200", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-A", "team": "CMP1", "eqpId": "CMP-A102", "model": "REFLEXION200", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-A", "team": "CMP1", "eqpId": "CMP-A103", "model": "REFLEXION300", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-A", "team": "CMP2", "eqpId": "CMP-A201", "model": "REFLEXION200", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-A", "team": "CMP2", "eqpId": "CMP-A202", "model": "REFLEXION300", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-B", "team": "CMP1", "eqpId": "CMP-B101", "model": "REFLEXION200", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-B", "team": "CMP1", "eqpId": "CMP-B102", "model": "REFLEXION200", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-B", "team": "CMP2", "eqpId": "CMP-B201", "model": "REFLEXION300", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-B", "team": "CMP2", "eqpId": "CMP-B202", "model": "REFLEXION300", "maker": "APPLIED", "modelGroup": "lk_model"},
    {"line": "LINE-B", "team": "CMP2", "eqpId": "CMP-B203", "model": "REFLEXION300", "maker": "APPLIED", "modelGroup": "lk_model"},
]

# ---------------------------------------------------------------------------
# FTP credentials  (MongoDB mockup)
# ---------------------------------------------------------------------------

MOCK_FTP_CREDS: dict[str, dict[str, str]] = {
    eqp["eqpId"]: {"host": f"192.168.{100 + i // 5}.{101 + i % 5}", "user": "ftpuser", "password": "ftppass"}
    for i, eqp in enumerate(MOCK_EQP_LIST)
}

# ---------------------------------------------------------------------------
# FTP file listings  (FTP mockup)  — CAS 35개 / JOB 35개 / Recipe 35개
# ---------------------------------------------------------------------------

_PROCS    = ["OXIDE", "METAL", "STI", "POLY", "CU", "TUNG", "ALU"]
_VARIANTS = ["A", "B", "C", "D", "E"]
_MODES    = ["STD", "FAST", "PRO", "ECO", "AGG"]
_STEPS    = ["01", "02", "03", "04", "05"]

_DATES = [
    "25-01-10", "25-01-15", "25-01-22",
    "25-02-05", "25-02-14", "25-02-20",
    "25-03-03", "25-03-11", "25-03-19",
    "25-04-02", "25-04-09", "25-04-17",
]
_TIMES = [
    "08:00AM", "08:30AM", "09:00AM", "09:30AM", "10:00AM",
    "10:30AM", "11:00AM", "11:30AM", "13:00PM", "13:30PM",
    "14:00PM", "14:30PM", "15:00PM", "15:30PM", "16:00PM", "16:30PM",
]

def _dt(idx: int) -> str:
    return f"{_DATES[idx % len(_DATES)]} {_TIMES[idx % len(_TIMES)]}"


MOCK_CAS_LIST: list[dict[str, str]] = [
    {"name": f"CAS_{proc}_{var}.cas", "modifiedAt": _dt(i * 5 + j), "size": "512", "rawLine": ""}
    for i, proc in enumerate(_PROCS)
    for j, var in enumerate(_VARIANTS)
]  # 35 items

MOCK_JOB_LIST: list[dict[str, str]] = [
    {"name": f"JOB_{proc}_{mode}.job", "modifiedAt": _dt(i * 5 + j + 3), "size": "1024", "rawLine": ""}
    for i, proc in enumerate(_PROCS)
    for j, mode in enumerate(_MODES)
]  # 35 items

MOCK_RECIPE_LIST: list[dict[str, str]] = [
    {"name": f"RCP_{proc}_{step}", "modifiedAt": _dt(i * 5 + j + 1), "size": "2048", "rawLine": ""}
    for i, proc in enumerate(_PROCS)
    for j, step in enumerate(_STEPS)
]  # 35 items

MOCK_FTP_RESULT: dict = {
    "cas_list": MOCK_CAS_LIST,
    "job_list": MOCK_JOB_LIST,
    "recipe_list": MOCK_RECIPE_LIST,
    "resolved_paths": {
        "base":   r"\CMPDB\Lcmp",
        "cas":    "cas",
        "job":    "job",
        "recipe": "recipe",
    },
    "children": ["cas", "job", "recipe"],
}

# ---------------------------------------------------------------------------
# FTP file contents  (FTP mockup)
# ---------------------------------------------------------------------------

def _make_cas(assignments: dict[int, str]) -> str:
    lines: list[str] = []
    for i in range(1, 26):
        lines.append(f"[Slot {i}]")
        lines.append(f"Job Name={assignments.get(i, '')}")
        lines.append("")
    return "\r\n".join(lines)


def _make_cas_for(proc: str, var_idx: int) -> str:
    """각 variant별 슬롯 배정 패턴 (5가지)."""
    s = f"JOB_{proc}_STD.job"
    f_ = f"JOB_{proc}_FAST.job"
    p = f"JOB_{proc}_PRO.job"
    e = f"JOB_{proc}_ECO.job"
    a = f"JOB_{proc}_AGG.job"
    patterns = [
        {i: s  for i in range(1, 13)} | {i: f_ for i in range(13, 19)},
        {i: f_ for i in range(1, 13)} | {i: s  for i in range(13, 21)},
        {i: p  for i in range(1, 11)} | {i: s  for i in range(11, 19)} | {i: f_ for i in range(19, 25)},
        {i: e  for i in range(1, 16)} | {i: s  for i in range(16, 23)},
        {i: a  for i in range(1, 9)}  | {i: f_ for i in range(9, 17)}  | {i: s  for i in range(17, 23)},
    ]
    return _make_cas(patterns[var_idx])


def _job(p1_pol: str, p2_pol: str, p3_pol: str = "(None)", cln_recipe: str = "CLN_OXIDE_01") -> str:
    return (
        "[Pre-Metrology]\r\n"
        "Do Pre Metrology=FALSE\r\n"
        "Recipe=(None)\r\n"
        "\r\n"
        "[Polisher]\r\n"
        "Route to Polisher=TRUE\r\n"
        f"Platen 1 Polish Recipe={p1_pol}\r\n"
        "Platen 1 Condition Recipe=(None)\r\n"
        "Platen 1 Ex Situ Condition Recipe=(None)\r\n"
        "Platen 1 Ex Situ Conditioning Optimization=0\r\n"
        "Platen 1 ISRM Algorithm=(None)\r\n"
        "Platen 1 WL Algorithm=(None)\r\n"
        "Platen 1 RTPC Recipe=(None)\r\n"
        "Platen 1 PRC Algorithm=(None)\r\n"
        "Platen 1 FT Algorithm=(None)\r\n"
        f"Platen 2 Polish Recipe={p2_pol}\r\n"
        "Platen 2 Condition Recipe=(None)\r\n"
        "Platen 2 Ex Situ Condition Recipe=(None)\r\n"
        "Platen 2 Ex Situ Conditioning Optimization=0\r\n"
        "Platen 2 ISRM Algorithm=(None)\r\n"
        "Platen 2 WL Algorithm=(None)\r\n"
        "Platen 2 RTPC Recipe=(None)\r\n"
        "Platen 2 PRC Algorithm=(None)\r\n"
        "Platen 2 FT Algorithm=(None)\r\n"
        f"Platen 3 Polish Recipe={p3_pol}\r\n"
        "Platen 3 Condition Recipe=(None)\r\n"
        "Platen 3 Ex Situ Condition Recipe=(None)\r\n"
        "Platen 3 Ex Situ Conditioning Optimization=0\r\n"
        "Platen 3 ISRM Algorithm=(None)\r\n"
        "Platen 3 WL Algorithm=(None)\r\n"
        "Platen 3 RTPC Recipe=(None)\r\n"
        "Platen 3 PRC Algorithm=(None)\r\n"
        "Platen 3 FT Algorithm=(None)\r\n"
        "Use Head 1=TRUE\r\n"
        "Use Head 2=TRUE\r\n"
        "Use Head 3=TRUE\r\n"
        "Use Head 4=FALSE\r\n"
        "\r\n"
        "[Cleaner]\r\n"
        "Route to Cleaner=TRUE\r\n"
        "Number of Steps=2\r\n"
        "Step 0 Station ID=BR1\r\n"
        f"Step 0 Recipe={cln_recipe}\r\n"
        "Step 1 Station ID=BR2\r\n"
        f"Step 1 Recipe={cln_recipe}\r\n"
        "\r\n"
        "[Post-Metrology]\r\n"
        "Do Post Metrology=FALSE\r\n"
        "Recipe=(None)\r\n"
    )


def _make_job_for(proc: str, mode_idx: int) -> str:
    """각 mode별 플래튼 레시피 조합 (5가지)."""
    r = [f"RCP_{proc}_{s}" for s in _STEPS]
    cln = f"CLN_{proc}_01" if proc in ("OXIDE", "METAL") else "CLN_OXIDE_01"
    configs = [
        (r[0], r[1], "(None)", cln),   # STD
        (r[1], r[0], "(None)", cln),   # FAST (역순)
        (r[0], r[1], r[2],    cln),    # PRO  (3플래튼)
        (r[2], r[3], "(None)", cln),   # ECO
        (r[1], r[2], r[3],    cln),    # AGG  (3플래튼)
    ]
    p1, p2, p3, cln_r = configs[mode_idx]
    return _job(p1, p2, p3, cln_r)


# 모든 CAS / JOB 파일 내용 자동 생성
MOCK_FILE_CONTENTS: dict[str, str] = {}
for _proc in _PROCS:
    for _j, _var in enumerate(_VARIANTS):
        MOCK_FILE_CONTENTS[f"CAS_{_proc}_{_var}.cas"] = _make_cas_for(_proc, _j)
    for _j, _mode in enumerate(_MODES):
        MOCK_FILE_CONTENTS[f"JOB_{_proc}_{_mode}.job"] = _make_job_for(_proc, _j)


def get_mock_file_text(file_name: str) -> str:
    """Case-insensitive lookup of mock file content by bare filename."""
    key = file_name.strip().upper()
    for k, v in MOCK_FILE_CONTENTS.items():
        if k.upper() == key:
            return v
    return f"; [MOCK] file not found: {file_name}\r\n"


def get_mock_source_recipe_text(recipe_name: str) -> str:
    """Generate parseable mock text for text-based recipe files (.meg/.br/.dryr/.cln)."""
    name = recipe_name.strip()
    lower = name.lower()
    if lower.endswith('.meg'):
        return (
            f"Recipe Comments: [MOCK] {name}\r\n"
            "Step 1:\r\n"
            "  Step Comments: Main\r\n"
            "  Time: 60\r\n"
            "  Wafer RPM: 100\r\n"
            "  Meg Power: 50\r\n"
            "Step 2:\r\n"
            "  Step Comments: Rinse\r\n"
            "  Time: 30\r\n"
            "  Wafer RPM: 50\r\n"
            "  Meg Power: 0\r\n"
        )
    if lower.endswith('.br'):
        return (
            f"Recipe Comments: [MOCK] {name}\r\n"
            "Step 1:\r\n"
            "  Step Comments: Scrub\r\n"
            "  Time: 60\r\n"
            "  Brush RPM: 400\r\n"
            "  Brush Pos: Closed\r\n"
            "  Brush Gap: 2.5\r\n"
            "  Wafer RPM: 30\r\n"
            "  DI Water On/Off: On\r\n"
            "  DIW Brush Flow Rate: 300\r\n"
            "Step 2:\r\n"
            "  Step Comments: Rinse\r\n"
            "  Time: 30\r\n"
            "  Brush Pos: Open\r\n"
            "  Wafer RPM: 30\r\n"
            "  DI Water On/Off: On\r\n"
            "  DIW Brush Flow Rate: 500\r\n"
        )
    if lower.endswith('.dryr') or lower.endswith('.drpr'):
        return (
            f"Recipe Comments: [MOCK] {name}\r\n"
            "Step 1:\r\n"
            "  IPA Flow: 8\r\n"
            "  Vapor Carrier Flow: 10\r\n"
            "  Motion Index: 2\r\n"
        )
    if lower.endswith('.cln'):
        return (
            f"Recipe Comments: [MOCK] {name}\r\n"
            "Step 1:\r\n"
            "  Step Comments: Clean\r\n"
            "  Time: 45\r\n"
        )
    return f"; [MOCK] {name}\r\n"


# ---------------------------------------------------------------------------
# Recipe source list items  (FTP mockup for RECIPE_SOURCE_CONFIG paths)
# ---------------------------------------------------------------------------

def _src(name: str, idx: int, size: str = "2048") -> dict[str, str]:
    return {"name": name, "modifiedAt": _dt(idx), "size": size, "rawLine": ""}


MOCK_SOURCE_ITEMS: dict[str, list[dict[str, str]]] = {
    "polishRecipe": [
        _src(f"RCP_{proc}_{step}.pol", i * 5 + j)
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(_STEPS)
    ],  # 35 items
    "conditionRecipe": [
        _src(f"CON_{proc}_{step}.con", i * 5 + j, "1024")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(_STEPS)
    ],  # 35 items
    "exSituCondition": [
        _src(f"CON_{proc}_{step}.con", i * 5 + j + 2, "1024")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(_STEPS)
    ],  # 35 items
    "specialExSitu": [
        _src(f"CON_SPECIAL_{proc}_{step:02d}.con", i * 3 + j, "1024")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 4))
    ],  # 21 items
    "isrmAlgorithm": [
        _src(f"ISRM_{proc}_{step:02d}.alg", i * 3 + j, "512")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 4))
    ],  # 21 items
    "rtpcRecipe": [
        _src(f"RTPC_{proc}_{step:02d}.scx", i * 3 + j, "512")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 4))
    ],  # 21 items
    "hcluPostLoad": [
        _src(f"CLN_{proc}_{step:02d}.cln", i * 3 + j, "512")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 4))
    ],  # 21 items
    "hcluPreUnload": [
        _src(f"CLN_{proc}_{step:02d}.cln", i * 3 + j + 1, "512")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 4))
    ],  # 21 items
    "megasonics": [
        _src(f"MEG_{proc}_{step:02d}.meg", i * 2 + j, "512")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 3))
    ],  # 14 items
    "brush1": [
        _src(f"BR_{proc}_{step:02d}.br", i * 3 + j, "512")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 4))
    ],  # 21 items
    "brush2": [
        _src(f"BR_{proc}_{step:02d}.br", i * 3 + j + 2, "512")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 4))
    ],  # 21 items
    "vaporDryer": [],
    "metrologyRecipe": [
        _src(f"MET_{proc}_{step:02d}", i * 3 + j, "256")
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(range(1, 4))
    ],  # 21 items
    "recipe": [
        _src(f"RCP_{proc}_{step}", i * 5 + j + 1)
        for i, proc in enumerate(_PROCS)
        for j, step in enumerate(_STEPS)
    ],  # 35 items
}
