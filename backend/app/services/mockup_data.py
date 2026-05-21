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
# FTP file listings  (FTP mockup)
# ---------------------------------------------------------------------------

_D = "25-01-15"  # shared mock date prefix

MOCK_CAS_LIST: list[dict[str, str]] = [
    {"name": "CAS_OXIDE_A.cas",  "modifiedAt": f"{_D} 09:30AM", "size": "512",  "rawLine": ""},
    {"name": "CAS_OXIDE_B.cas",  "modifiedAt": f"{_D} 10:00AM", "size": "512",  "rawLine": ""},
    {"name": "CAS_METAL_A.cas",  "modifiedAt": f"{_D} 14:20PM", "size": "512",  "rawLine": ""},
]

MOCK_JOB_LIST: list[dict[str, str]] = [
    {"name": "JOB_OXIDE_STD.job",  "modifiedAt": f"{_D} 09:15AM", "size": "1024", "rawLine": ""},
    {"name": "JOB_OXIDE_FAST.job", "modifiedAt": f"{_D} 11:00AM", "size": "1024", "rawLine": ""},
    {"name": "JOB_METAL_STD.job",  "modifiedAt": f"{_D} 13:00PM", "size": "1024", "rawLine": ""},
    {"name": "JOB_METAL_FAST.job", "modifiedAt": f"{_D} 13:30PM", "size": "1024", "rawLine": ""},
]

MOCK_RECIPE_LIST: list[dict[str, str]] = [
    {"name": "RCP_OXIDE_01", "modifiedAt": f"{_D} 08:00AM", "size": "2048", "rawLine": ""},
    {"name": "RCP_OXIDE_02", "modifiedAt": f"{_D} 08:30AM", "size": "2048", "rawLine": ""},
    {"name": "RCP_METAL_01", "modifiedAt": f"{_D} 08:45AM", "size": "2048", "rawLine": ""},
    {"name": "RCP_METAL_02", "modifiedAt": f"{_D} 09:00AM", "size": "2048", "rawLine": ""},
]

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
# Keys are bare file names (case-insensitive lookup via get_mock_file_text).
# ---------------------------------------------------------------------------

def _make_cas(assignments: dict[int, str]) -> str:
    lines: list[str] = []
    for i in range(1, 26):
        lines.append(f"[Slot {i}]")
        lines.append(f"Job Name={assignments.get(i, '')}")
        lines.append("")
    return "\r\n".join(lines)

_CAS_OXIDE_A = _make_cas({i: "JOB_OXIDE_STD.job"  for i in range(1, 13)}
                          | {i: "JOB_OXIDE_FAST.job" for i in range(13, 19)})
_CAS_OXIDE_B = _make_cas({i: "JOB_OXIDE_FAST.job" for i in range(1, 13)}
                          | {i: "JOB_OXIDE_STD.job"  for i in range(13, 21)})
_CAS_METAL_A = _make_cas({i: "JOB_METAL_STD.job"  for i in range(1, 11)}
                          | {i: "JOB_METAL_FAST.job" for i in range(11, 21)})

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

MOCK_FILE_CONTENTS: dict[str, str] = {
    "CAS_OXIDE_A.cas":  _CAS_OXIDE_A,
    "CAS_OXIDE_B.cas":  _CAS_OXIDE_B,
    "CAS_METAL_A.cas":  _CAS_METAL_A,
    "JOB_OXIDE_STD.job":  _job("RCP_OXIDE_01", "RCP_OXIDE_02", "(None)", "CLN_OXIDE_01"),
    "JOB_OXIDE_FAST.job": _job("RCP_OXIDE_02", "RCP_OXIDE_01", "(None)", "CLN_OXIDE_01"),
    "JOB_METAL_STD.job":  _job("RCP_METAL_01", "RCP_METAL_02", "(None)", "CLN_METAL_01"),
    "JOB_METAL_FAST.job": _job("RCP_METAL_02", "RCP_METAL_01", "(None)", "CLN_METAL_01"),
}


def get_mock_file_text(file_name: str) -> str:
    """Case-insensitive lookup of mock file content by bare filename."""
    key = file_name.strip().upper()
    for k, v in MOCK_FILE_CONTENTS.items():
        if k.upper() == key:
            return v
    return f"; [MOCK] file not found: {file_name}\r\n"


# ---------------------------------------------------------------------------
# Recipe source list items  (FTP mockup for RECIPE_SOURCE_CONFIG paths)
# ---------------------------------------------------------------------------

_RD = "25-01-15"

MOCK_SOURCE_ITEMS: dict[str, list[dict[str, str]]] = {
    "polishRecipe": [
        {"name": "RCP_OXIDE_01.pol", "modifiedAt": f"{_RD} 08:00AM", "size": "2048", "rawLine": ""},
        {"name": "RCP_OXIDE_02.pol", "modifiedAt": f"{_RD} 08:30AM", "size": "2048", "rawLine": ""},
        {"name": "RCP_METAL_01.pol", "modifiedAt": f"{_RD} 09:00AM", "size": "2048", "rawLine": ""},
        {"name": "RCP_METAL_02.pol", "modifiedAt": f"{_RD} 09:30AM", "size": "2048", "rawLine": ""},
    ],
    "conditionRecipe": [
        {"name": "CON_OXIDE_01.con", "modifiedAt": f"{_RD} 08:00AM", "size": "1024", "rawLine": ""},
        {"name": "CON_METAL_01.con", "modifiedAt": f"{_RD} 08:30AM", "size": "1024", "rawLine": ""},
    ],
    "exSituCondition": [
        {"name": "CON_OXIDE_01.con", "modifiedAt": f"{_RD} 08:00AM", "size": "1024", "rawLine": ""},
        {"name": "CON_METAL_01.con", "modifiedAt": f"{_RD} 08:30AM", "size": "1024", "rawLine": ""},
    ],
    "specialExSitu": [
        {"name": "CON_SPECIAL_01.con", "modifiedAt": f"{_RD} 08:00AM", "size": "1024", "rawLine": ""},
    ],
    "isrmAlgorithm": [
        {"name": "ISRM_OXIDE.alg", "modifiedAt": f"{_RD} 08:00AM", "size": "512", "rawLine": ""},
        {"name": "ISRM_METAL.alg", "modifiedAt": f"{_RD} 08:30AM", "size": "512", "rawLine": ""},
    ],
    "rtpcRecipe": [
        {"name": "RTPC_01.scx", "modifiedAt": f"{_RD} 08:00AM", "size": "512", "rawLine": ""},
    ],
    "hcluPostLoad": [
        {"name": "CLN_OXIDE_01.cln", "modifiedAt": f"{_RD} 08:00AM", "size": "512", "rawLine": ""},
        {"name": "CLN_METAL_01.cln", "modifiedAt": f"{_RD} 08:30AM", "size": "512", "rawLine": ""},
    ],
    "hcluPreUnload": [
        {"name": "CLN_OXIDE_01.cln", "modifiedAt": f"{_RD} 08:00AM", "size": "512", "rawLine": ""},
        {"name": "CLN_METAL_01.cln", "modifiedAt": f"{_RD} 08:30AM", "size": "512", "rawLine": ""},
    ],
    "megasonics": [
        {"name": "MEG_OXIDE_01.meg", "modifiedAt": f"{_RD} 08:00AM", "size": "512", "rawLine": ""},
    ],
    "brush1": [
        {"name": "BR_OXIDE_01.br", "modifiedAt": f"{_RD} 08:00AM", "size": "512", "rawLine": ""},
        {"name": "BR_METAL_01.br", "modifiedAt": f"{_RD} 08:30AM", "size": "512", "rawLine": ""},
    ],
    "brush2": [
        {"name": "BR_OXIDE_01.br", "modifiedAt": f"{_RD} 08:00AM", "size": "512", "rawLine": ""},
        {"name": "BR_METAL_01.br", "modifiedAt": f"{_RD} 08:30AM", "size": "512", "rawLine": ""},
    ],
    "vaporDryer": [],
    "metrologyRecipe": [
        {"name": "MET_OXIDE_01", "modifiedAt": f"{_RD} 08:00AM", "size": "256", "rawLine": ""},
        {"name": "MET_METAL_01", "modifiedAt": f"{_RD} 08:30AM", "size": "256", "rawLine": ""},
    ],
    "recipe": [
        {"name": "RCP_OXIDE_01", "modifiedAt": f"{_RD} 08:00AM", "size": "2048", "rawLine": ""},
        {"name": "RCP_OXIDE_02", "modifiedAt": f"{_RD} 08:30AM", "size": "2048", "rawLine": ""},
        {"name": "RCP_METAL_01", "modifiedAt": f"{_RD} 09:00AM", "size": "2048", "rawLine": ""},
        {"name": "RCP_METAL_02", "modifiedAt": f"{_RD} 09:30AM", "size": "2048", "rawLine": ""},
    ],
}
