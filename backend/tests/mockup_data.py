"""
Mockup data for CMP semiconductor recipe management system.

The real backend connects to internal company infrastructure (PostgreSQL, MongoDB, FTP)
that is inaccessible outside the company network. This module provides realistic
static data matching the exact shapes expected by the production API.

All values are representative of real CMP process naming conventions.
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# Equipment options
# EqpOptionItem: { line, team, eqpId, model?, maker?, modelGroup? }
# EqpOptionsResponse: { items, lineOptions, teamOptions, eqpOptions }
# ---------------------------------------------------------------------------

MOCK_EQP_OPTIONS: dict[str, Any] = {
    "items": [
        {
            "line": "LINE-A",
            "team": "CMP1",
            "eqpId": "CMP-A01",
            "model": "Reflexion LK Prime",
            "maker": "AMAT",
            "modelGroup": "Reflexion",
        },
        {
            "line": "LINE-A",
            "team": "CMP1",
            "eqpId": "CMP-A02",
            "model": "Reflexion LK Prime",
            "maker": "AMAT",
            "modelGroup": "Reflexion",
        },
        {
            "line": "LINE-A",
            "team": "CMP2",
            "eqpId": "CMP-A03",
            "model": "Reflexion GT",
            "maker": "AMAT",
            "modelGroup": "Reflexion",
        },
        {
            "line": "LINE-B",
            "team": "CMP1",
            "eqpId": "CMP-B01",
            "model": "Mirra Mesa",
            "maker": "AMAT",
            "modelGroup": "Mirra",
        },
        {
            "line": "LINE-B",
            "team": "CMP1",
            "eqpId": "CMP-B02",
            "model": "Mirra Mesa",
            "maker": "AMAT",
            "modelGroup": "Mirra",
        },
        {
            "line": "LINE-B",
            "team": "CMP2",
            "eqpId": "CMP-B03",
            "model": "Reflexion LK",
            "maker": "AMAT",
            "modelGroup": "Reflexion",
        },
        {
            "line": "LINE-B",
            "team": "CMP2",
            "eqpId": "CMP-B04",
            "model": "Reflexion LK",
            "maker": "AMAT",
            "modelGroup": "Reflexion",
        },
    ],
    "lineOptions": ["LINE-A", "LINE-B"],
    "teamOptions": ["CMP1", "CMP2"],
    "eqpOptions": ["CMP-A01", "CMP-A02", "CMP-A03", "CMP-B01", "CMP-B02", "CMP-B03", "CMP-B04"],
}

# ---------------------------------------------------------------------------
# CAS file list
# FileEntry: { name, modifiedAt, size?, rawLine? }
# ---------------------------------------------------------------------------

MOCK_CAS_LIST: list[dict[str, Any]] = [
    {
        "name": "MAIN.cas",
        "modifiedAt": "2026-04-28T08:15:00",
        "size": "4.2 KB",
    },
    {
        "name": "BACKUP.cas",
        "modifiedAt": "2026-04-20T14:30:00",
        "size": "4.1 KB",
    },
    {
        "name": "TEST.cas",
        "modifiedAt": "2026-05-01T11:00:00",
        "size": "2.8 KB",
    },
    {
        "name": "QUAL.cas",
        "modifiedAt": "2026-03-15T09:45:00",
        "size": "3.5 KB",
    },
]

# ---------------------------------------------------------------------------
# JOB file list
# { id, jobName, recipeName, modifiedAt }
# ---------------------------------------------------------------------------

MOCK_JOB_LIST: list[dict[str, Any]] = [
    {
        "id": "JOB-001",
        "jobName": "STI_CMP_P1.job",
        "recipeName": "STI_POL_P1_MAIN.pol",
        "modifiedAt": "2026-04-28T08:10:00",
    },
    {
        "id": "JOB-002",
        "jobName": "STI_CMP_P2.job",
        "recipeName": "STI_POL_P2_MAIN.pol",
        "modifiedAt": "2026-04-28T08:10:00",
    },
    {
        "id": "JOB-003",
        "jobName": "W_CMP_BULK.job",
        "recipeName": "W_POL_P1_BULK.pol",
        "modifiedAt": "2026-04-25T16:00:00",
    },
    {
        "id": "JOB-004",
        "jobName": "W_CMP_BARRIER.job",
        "recipeName": "W_POL_P2_BARRIER.pol",
        "modifiedAt": "2026-04-25T16:05:00",
    },
    {
        "id": "JOB-005",
        "jobName": "CU_CMP_OXIDE.job",
        "recipeName": "CU_POL_P1_OXIDE.pol",
        "modifiedAt": "2026-05-02T10:20:00",
    },
    {
        "id": "JOB-006",
        "jobName": "CU_CMP_BARRIER_CLN.job",
        "recipeName": "CU_POL_P2_BARRIER.pol",
        "modifiedAt": "2026-05-02T10:25:00",
    },
]

# ---------------------------------------------------------------------------
# CAS content — keyed by casId (= cas file name)
# CasContentResponse: { casId, slots: [{ slot, jobId, jobName, recipeName }] }
# Slots are 1-indexed, 1–25
# ---------------------------------------------------------------------------

MOCK_CAS_CONTENT: dict[str, dict[str, Any]] = {
    "MAIN.cas": {
        "casId": "MAIN.cas",
        "slots": [
            {"slot": 1,  "jobId": "JOB-001", "jobName": "STI_CMP_P1.job",        "recipeName": "STI_POL_P1_MAIN.pol"},
            {"slot": 2,  "jobId": "JOB-002", "jobName": "STI_CMP_P2.job",        "recipeName": "STI_POL_P2_MAIN.pol"},
            {"slot": 3,  "jobId": "JOB-003", "jobName": "W_CMP_BULK.job",        "recipeName": "W_POL_P1_BULK.pol"},
            {"slot": 4,  "jobId": "JOB-004", "jobName": "W_CMP_BARRIER.job",     "recipeName": "W_POL_P2_BARRIER.pol"},
            {"slot": 5,  "jobId": "JOB-005", "jobName": "CU_CMP_OXIDE.job",      "recipeName": "CU_POL_P1_OXIDE.pol"},
            {"slot": 6,  "jobId": "JOB-006", "jobName": "CU_CMP_BARRIER_CLN.job","recipeName": "CU_POL_P2_BARRIER.pol"},
            {"slot": 7,  "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 8,  "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 9,  "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 10, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 11, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 12, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 13, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 14, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 15, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 16, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 17, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 18, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 19, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 20, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 21, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 22, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 23, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 24, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
            {"slot": 25, "jobId": "",         "jobName": "(None)",                "recipeName": "(None)"},
        ],
        "jobIds": ["JOB-001", "JOB-002", "JOB-003", "JOB-004", "JOB-005", "JOB-006"],
    },
    "BACKUP.cas": {
        "casId": "BACKUP.cas",
        "slots": [
            {"slot": 1,  "jobId": "JOB-001", "jobName": "STI_CMP_P1.job",    "recipeName": "STI_POL_P1_MAIN.pol"},
            {"slot": 2,  "jobId": "JOB-002", "jobName": "STI_CMP_P2.job",    "recipeName": "STI_POL_P2_MAIN.pol"},
            {"slot": 3,  "jobId": "JOB-003", "jobName": "W_CMP_BULK.job",    "recipeName": "W_POL_P1_BULK.pol"},
            {"slot": 4,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 5,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 6,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 7,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 8,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 9,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 10, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 11, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 12, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 13, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 14, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 15, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 16, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 17, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 18, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 19, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 20, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 21, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 22, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 23, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 24, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 25, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
        ],
        "jobIds": ["JOB-001", "JOB-002", "JOB-003"],
    },
    "TEST.cas": {
        "casId": "TEST.cas",
        "slots": [
            {"slot": 1,  "jobId": "JOB-005", "jobName": "CU_CMP_OXIDE.job",       "recipeName": "CU_POL_P1_OXIDE.pol"},
            {"slot": 2,  "jobId": "JOB-006", "jobName": "CU_CMP_BARRIER_CLN.job", "recipeName": "CU_POL_P2_BARRIER.pol"},
            {"slot": 3,  "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 4,  "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 5,  "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 6,  "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 7,  "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 8,  "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 9,  "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 10, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 11, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 12, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 13, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 14, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 15, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 16, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 17, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 18, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 19, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 20, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 21, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 22, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 23, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 24, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
            {"slot": 25, "jobId": "",         "jobName": "(None)",                 "recipeName": "(None)"},
        ],
        "jobIds": ["JOB-005", "JOB-006"],
    },
    "QUAL.cas": {
        "casId": "QUAL.cas",
        "slots": [
            {"slot": 1,  "jobId": "JOB-001", "jobName": "STI_CMP_P1.job",    "recipeName": "STI_POL_P1_MAIN.pol"},
            {"slot": 2,  "jobId": "JOB-003", "jobName": "W_CMP_BULK.job",    "recipeName": "W_POL_P1_BULK.pol"},
            {"slot": 3,  "jobId": "JOB-004", "jobName": "W_CMP_BARRIER.job", "recipeName": "W_POL_P2_BARRIER.pol"},
            {"slot": 4,  "jobId": "JOB-005", "jobName": "CU_CMP_OXIDE.job",  "recipeName": "CU_POL_P1_OXIDE.pol"},
            {"slot": 5,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 6,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 7,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 8,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 9,  "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 10, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 11, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 12, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 13, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 14, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 15, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 16, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 17, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 18, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 19, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 20, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 21, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 22, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 23, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 24, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
            {"slot": 25, "jobId": "",         "jobName": "(None)",            "recipeName": "(None)"},
        ],
        "jobIds": ["JOB-001", "JOB-003", "JOB-004", "JOB-005"],
    },
}

# ---------------------------------------------------------------------------
# JOB content — keyed by jobId
# JobContentResponse: { jobId, jobName, baseRecipeName, parsed: JobParsed }
#
# JobParsed shape (from job_parser.py):
#   preMetrology:  { enabled, recipe }
#   polisher:      { route, rows: [{ label, p1, p2, p3 }] }
#   cleaner:       { route, numberOfSteps, rows: [{ index, module, recipe }] }
#   postMetrology: { enabled, recipe }
#
# Standard polisher row labels (from parse_job_text):
#   Polish Recipe, Condition Recipe, Ex Situ Condition, Special Ex Situ,
#   ISRM Algorithm, WL Algorithm, RTPC Recipe, PRC Algorithm, FT Algorithm
#
# Standard cleaner station IDs: CIN, BR1, BR2, DRYER, MEG, COUT
# ---------------------------------------------------------------------------

MOCK_JOB_CONTENT: dict[str, dict[str, Any]] = {
    "JOB-001": {
        "jobId": "JOB-001",
        "jobName": "STI_CMP_P1.job",
        "baseRecipeName": "STI_POL_P1_MAIN.pol",
        "parsed": {
            "preMetrology": {
                "enabled": True,
                "recipe": "STI_PRE_METRO.rcp",
            },
            "polisher": {
                "route": True,
                "rows": [
                    {"label": "Polish Recipe",      "p1": "STI_POL_P1_MAIN.pol",  "p2": "STI_POL_P2_FINE.pol",  "p3": "(None)"},
                    {"label": "Condition Recipe",   "p1": "STI_CON_P1_STD.con",   "p2": "STI_CON_P2_STD.con",   "p3": "(None)"},
                    {"label": "Ex Situ Condition",  "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "Special Ex Situ",    "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "ISRM Algorithm",     "p1": "STI_ISRM_P1.alg",      "p2": "(None)",               "p3": "(None)"},
                    {"label": "WL Algorithm",       "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "RTPC Recipe",        "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "PRC Algorithm",      "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "FT Algorithm",       "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                ],
            },
            "cleaner": {
                "route": True,
                "numberOfSteps": 4,
                "rows": [
                    {"index": "Cleaner Input",  "module": "CIN",   "recipe": "STI_CLN_INPUT.rcp"},
                    {"index": "Brush 1",        "module": "BR1",   "recipe": "STI_CLN_BRUSH1.rcp"},
                    {"index": "Brush 2",        "module": "BR2",   "recipe": "STI_CLN_BRUSH2.rcp"},
                    {"index": "Vapor Dryer",    "module": "DRYER", "recipe": "STI_CLN_DRYER.rcp"},
                ],
            },
            "postMetrology": {
                "enabled": True,
                "recipe": "STI_POST_METRO.rcp",
            },
        },
    },
    "JOB-002": {
        "jobId": "JOB-002",
        "jobName": "STI_CMP_P2.job",
        "baseRecipeName": "STI_POL_P2_MAIN.pol",
        "parsed": {
            "preMetrology": {
                "enabled": False,
                "recipe": "(None)",
            },
            "polisher": {
                "route": True,
                "rows": [
                    {"label": "Polish Recipe",      "p1": "(None)",               "p2": "STI_POL_P2_MAIN.pol",  "p3": "(None)"},
                    {"label": "Condition Recipe",   "p1": "(None)",               "p2": "STI_CON_P2_STD.con",   "p3": "(None)"},
                    {"label": "Ex Situ Condition",  "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "Special Ex Situ",    "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "ISRM Algorithm",     "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "WL Algorithm",       "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "RTPC Recipe",        "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "PRC Algorithm",      "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "FT Algorithm",       "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                ],
            },
            "cleaner": {
                "route": True,
                "numberOfSteps": 3,
                "rows": [
                    {"index": "Brush 1",     "module": "BR1",   "recipe": "STI_CLN_BRUSH1.rcp"},
                    {"index": "Brush 2",     "module": "BR2",   "recipe": "STI_CLN_BRUSH2.rcp"},
                    {"index": "Vapor Dryer", "module": "DRYER", "recipe": "STI_CLN_DRYER.rcp"},
                ],
            },
            "postMetrology": {
                "enabled": True,
                "recipe": "STI_POST_METRO.rcp",
            },
        },
    },
    "JOB-003": {
        "jobId": "JOB-003",
        "jobName": "W_CMP_BULK.job",
        "baseRecipeName": "W_POL_P1_BULK.pol",
        "parsed": {
            "preMetrology": {
                "enabled": False,
                "recipe": "(None)",
            },
            "polisher": {
                "route": True,
                "rows": [
                    {"label": "Polish Recipe",      "p1": "W_POL_P1_BULK.pol",    "p2": "(None)",              "p3": "(None)"},
                    {"label": "Condition Recipe",   "p1": "W_CON_P1_STD.con",     "p2": "(None)",              "p3": "(None)"},
                    {"label": "Ex Situ Condition",  "p1": "(None)",               "p2": "(None)",              "p3": "(None)"},
                    {"label": "Special Ex Situ",    "p1": "(None)",               "p2": "(None)",              "p3": "(None)"},
                    {"label": "ISRM Algorithm",     "p1": "(None)",               "p2": "(None)",              "p3": "(None)"},
                    {"label": "WL Algorithm",       "p1": "W_WL_P1.alg",          "p2": "(None)",              "p3": "(None)"},
                    {"label": "RTPC Recipe",        "p1": "(None)",               "p2": "(None)",              "p3": "(None)"},
                    {"label": "PRC Algorithm",      "p1": "(None)",               "p2": "(None)",              "p3": "(None)"},
                    {"label": "FT Algorithm",       "p1": "(None)",               "p2": "(None)",              "p3": "(None)"},
                ],
            },
            "cleaner": {
                "route": True,
                "numberOfSteps": 5,
                "rows": [
                    {"index": "Cleaner Input",  "module": "CIN",   "recipe": "W_CLN_INPUT.rcp"},
                    {"index": "Megasonics",     "module": "MEG",   "recipe": "W_CLN_MEG.rcp"},
                    {"index": "Brush 1",        "module": "BR1",   "recipe": "W_CLN_BRUSH1.rcp"},
                    {"index": "Brush 2",        "module": "BR2",   "recipe": "W_CLN_BRUSH2.rcp"},
                    {"index": "Vapor Dryer",    "module": "DRYER", "recipe": "W_CLN_DRYER.rcp"},
                ],
            },
            "postMetrology": {
                "enabled": True,
                "recipe": "W_POST_METRO.rcp",
            },
        },
    },
    "JOB-004": {
        "jobId": "JOB-004",
        "jobName": "W_CMP_BARRIER.job",
        "baseRecipeName": "W_POL_P2_BARRIER.pol",
        "parsed": {
            "preMetrology": {
                "enabled": False,
                "recipe": "(None)",
            },
            "polisher": {
                "route": True,
                "rows": [
                    {"label": "Polish Recipe",      "p1": "(None)",               "p2": "W_POL_P2_BARRIER.pol", "p3": "(None)"},
                    {"label": "Condition Recipe",   "p1": "(None)",               "p2": "W_CON_P2_STD.con",     "p3": "(None)"},
                    {"label": "Ex Situ Condition",  "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "Special Ex Situ",    "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "ISRM Algorithm",     "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "WL Algorithm",       "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "RTPC Recipe",        "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "PRC Algorithm",      "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "FT Algorithm",       "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                ],
            },
            "cleaner": {
                "route": True,
                "numberOfSteps": 4,
                "rows": [
                    {"index": "Cleaner Input",  "module": "CIN",   "recipe": "W_CLN_INPUT.rcp"},
                    {"index": "Brush 1",        "module": "BR1",   "recipe": "W_CLN_BRUSH1.rcp"},
                    {"index": "Brush 2",        "module": "BR2",   "recipe": "W_CLN_BRUSH2.rcp"},
                    {"index": "Vapor Dryer",    "module": "DRYER", "recipe": "W_CLN_DRYER.rcp"},
                ],
            },
            "postMetrology": {
                "enabled": True,
                "recipe": "W_POST_METRO.rcp",
            },
        },
    },
    "JOB-005": {
        "jobId": "JOB-005",
        "jobName": "CU_CMP_OXIDE.job",
        "baseRecipeName": "CU_POL_P1_OXIDE.pol",
        "parsed": {
            "preMetrology": {
                "enabled": True,
                "recipe": "CU_PRE_METRO_OX.rcp",
            },
            "polisher": {
                "route": True,
                "rows": [
                    {"label": "Polish Recipe",      "p1": "CU_POL_P1_OXIDE.pol",  "p2": "CU_POL_P2_OXIDE.pol",  "p3": "(None)"},
                    {"label": "Condition Recipe",   "p1": "CU_CON_P1_STD.con",    "p2": "CU_CON_P2_STD.con",    "p3": "(None)"},
                    {"label": "Ex Situ Condition",  "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "Special Ex Situ",    "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "ISRM Algorithm",     "p1": "CU_ISRM_P1.alg",       "p2": "CU_ISRM_P2.alg",       "p3": "(None)"},
                    {"label": "WL Algorithm",       "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "RTPC Recipe",        "p1": "CU_RTPC_P1.rcp",       "p2": "(None)",               "p3": "(None)"},
                    {"label": "PRC Algorithm",      "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                    {"label": "FT Algorithm",       "p1": "(None)",               "p2": "(None)",               "p3": "(None)"},
                ],
            },
            "cleaner": {
                "route": True,
                "numberOfSteps": 6,
                "rows": [
                    {"index": "Cleaner Input",  "module": "CIN",   "recipe": "CU_CLN_INPUT.rcp"},
                    {"index": "Megasonics",     "module": "MEG",   "recipe": "CU_CLN_MEG.rcp"},
                    {"index": "Brush 1",        "module": "BR1",   "recipe": "CU_CLN_BRUSH1.rcp"},
                    {"index": "Brush 2",        "module": "BR2",   "recipe": "CU_CLN_BRUSH2.rcp"},
                    {"index": "Vapor Dryer",    "module": "DRYER", "recipe": "CU_CLN_DRYER.rcp"},
                    {"index": "Cleaner Output", "module": "COUT",  "recipe": "CU_CLN_OUTPUT.rcp"},
                ],
            },
            "postMetrology": {
                "enabled": True,
                "recipe": "CU_POST_METRO_OX.rcp",
            },
            "useHeads": {
                "head1": True,
                "head2": True,
                "head3": False,
                "head4": False,
            },
            "hcluRecipes": {
                "postLoad": "CU_HCLU_POSTLOAD.rcp",
                "preUnload": "CU_HCLU_PREUNLOAD.rcp",
            },
        },
    },
    "JOB-006": {
        "jobId": "JOB-006",
        "jobName": "CU_CMP_BARRIER_CLN.job",
        "baseRecipeName": "CU_POL_P2_BARRIER.pol",
        "parsed": {
            "preMetrology": {
                "enabled": False,
                "recipe": "(None)",
            },
            "polisher": {
                "route": True,
                "rows": [
                    {"label": "Polish Recipe",      "p1": "(None)",               "p2": "CU_POL_P2_BARRIER.pol", "p3": "CU_POL_P3_BUFF.pol"},
                    {"label": "Condition Recipe",   "p1": "(None)",               "p2": "CU_CON_P2_STD.con",     "p3": "CU_CON_P3_BUFF.con"},
                    {"label": "Ex Situ Condition",  "p1": "(None)",               "p2": "(None)",                "p3": "(None)"},
                    {"label": "Special Ex Situ",    "p1": "(None)",               "p2": "(None)",                "p3": "(None)"},
                    {"label": "ISRM Algorithm",     "p1": "(None)",               "p2": "(None)",                "p3": "(None)"},
                    {"label": "WL Algorithm",       "p1": "(None)",               "p2": "(None)",                "p3": "(None)"},
                    {"label": "RTPC Recipe",        "p1": "(None)",               "p2": "(None)",                "p3": "(None)"},
                    {"label": "PRC Algorithm",      "p1": "(None)",               "p2": "(None)",                "p3": "(None)"},
                    {"label": "FT Algorithm",       "p1": "(None)",               "p2": "(None)",                "p3": "(None)"},
                ],
            },
            "cleaner": {
                "route": True,
                "numberOfSteps": 5,
                "rows": [
                    {"index": "Cleaner Input",  "module": "CIN",   "recipe": "CU_CLN_INPUT.rcp"},
                    {"index": "Brush 1",        "module": "BR1",   "recipe": "CU_CLN_BRUSH1.rcp"},
                    {"index": "Brush 2",        "module": "BR2",   "recipe": "CU_CLN_BRUSH2.rcp"},
                    {"index": "Vapor Dryer",    "module": "DRYER", "recipe": "CU_CLN_DRYER.rcp"},
                    {"index": "Cleaner Output", "module": "COUT",  "recipe": "CU_CLN_OUTPUT.rcp"},
                ],
            },
            "postMetrology": {
                "enabled": True,
                "recipe": "CU_POST_METRO_BAR.rcp",
            },
        },
    },
}

# ---------------------------------------------------------------------------
# Recipe source lists — keyed by sourceKind
# RecipeSourceListResponse: { sourceKind, titleBase, path, exts, items: [...] }
# RecipeSourceListItem: { id, name, modifiedAt, sourceKind, ext? }
# ---------------------------------------------------------------------------

MOCK_RECIPE_SOURCE_LIST: dict[str, dict[str, Any]] = {
    "recipe": {
        "sourceKind": "recipe",
        "titleBase": "Recipe",
        "path": "/equipment/CMP-A01/recipes",
        "exts": [".rcp"],
        "items": [
            {"id": "RCP-001", "name": "STI_PRE_METRO.rcp",     "modifiedAt": "2026-04-10T09:00:00", "sourceKind": "recipe", "ext": ".rcp"},
            {"id": "RCP-002", "name": "STI_POST_METRO.rcp",    "modifiedAt": "2026-04-10T09:05:00", "sourceKind": "recipe", "ext": ".rcp"},
            {"id": "RCP-003", "name": "W_POST_METRO.rcp",      "modifiedAt": "2026-04-12T11:00:00", "sourceKind": "recipe", "ext": ".rcp"},
            {"id": "RCP-004", "name": "CU_PRE_METRO_OX.rcp",   "modifiedAt": "2026-04-15T13:30:00", "sourceKind": "recipe", "ext": ".rcp"},
            {"id": "RCP-005", "name": "CU_POST_METRO_OX.rcp",  "modifiedAt": "2026-04-15T13:35:00", "sourceKind": "recipe", "ext": ".rcp"},
            {"id": "RCP-006", "name": "CU_POST_METRO_BAR.rcp", "modifiedAt": "2026-04-15T14:00:00", "sourceKind": "recipe", "ext": ".rcp"},
        ],
    },
    "polishRecipe": {
        "sourceKind": "polishRecipe",
        "titleBase": "Polish Recipe",
        "path": "/equipment/CMP-A01/polish",
        "exts": [".pol"],
        "items": [
            {"id": "POL-001", "name": "STI_POL_P1_MAIN.pol",  "modifiedAt": "2026-04-20T08:00:00", "sourceKind": "polishRecipe", "ext": ".pol"},
            {"id": "POL-002", "name": "STI_POL_P2_FINE.pol",  "modifiedAt": "2026-04-20T08:05:00", "sourceKind": "polishRecipe", "ext": ".pol"},
            {"id": "POL-003", "name": "W_POL_P1_BULK.pol",    "modifiedAt": "2026-04-22T10:00:00", "sourceKind": "polishRecipe", "ext": ".pol"},
            {"id": "POL-004", "name": "W_POL_P2_BARRIER.pol", "modifiedAt": "2026-04-22T10:10:00", "sourceKind": "polishRecipe", "ext": ".pol"},
            {"id": "POL-005", "name": "CU_POL_P1_OXIDE.pol",  "modifiedAt": "2026-04-25T14:00:00", "sourceKind": "polishRecipe", "ext": ".pol"},
            {"id": "POL-006", "name": "CU_POL_P2_BARRIER.pol","modifiedAt": "2026-04-25T14:05:00", "sourceKind": "polishRecipe", "ext": ".pol"},
            {"id": "POL-007", "name": "CU_POL_P3_BUFF.pol",   "modifiedAt": "2026-04-25T14:10:00", "sourceKind": "polishRecipe", "ext": ".pol"},
            {"id": "POL-008", "name": "STI_POL_P2_MAIN.pol",  "modifiedAt": "2026-04-28T09:00:00", "sourceKind": "polishRecipe", "ext": ".pol"},
        ],
    },
    "conditionRecipe": {
        "sourceKind": "conditionRecipe",
        "titleBase": "Condition Recipe",
        "path": "/equipment/CMP-A01/condition",
        "exts": [".con"],
        "items": [
            {"id": "CON-001", "name": "STI_CON_P1_STD.con",  "modifiedAt": "2026-04-18T09:00:00", "sourceKind": "conditionRecipe", "ext": ".con"},
            {"id": "CON-002", "name": "STI_CON_P2_STD.con",  "modifiedAt": "2026-04-18T09:05:00", "sourceKind": "conditionRecipe", "ext": ".con"},
            {"id": "CON-003", "name": "W_CON_P1_STD.con",    "modifiedAt": "2026-04-20T10:00:00", "sourceKind": "conditionRecipe", "ext": ".con"},
            {"id": "CON-004", "name": "W_CON_P2_STD.con",    "modifiedAt": "2026-04-20T10:05:00", "sourceKind": "conditionRecipe", "ext": ".con"},
            {"id": "CON-005", "name": "CU_CON_P1_STD.con",   "modifiedAt": "2026-04-23T13:00:00", "sourceKind": "conditionRecipe", "ext": ".con"},
            {"id": "CON-006", "name": "CU_CON_P2_STD.con",   "modifiedAt": "2026-04-23T13:05:00", "sourceKind": "conditionRecipe", "ext": ".con"},
            {"id": "CON-007", "name": "CU_CON_P3_BUFF.con",  "modifiedAt": "2026-04-23T13:10:00", "sourceKind": "conditionRecipe", "ext": ".con"},
        ],
    },
    "isrmAlgorithm": {
        "sourceKind": "isrmAlgorithm",
        "titleBase": "ISRM Algorithm",
        "path": "/equipment/CMP-A01/isrm",
        "exts": [".alg"],
        "items": [
            {"id": "ALG-001", "name": "STI_ISRM_P1.alg", "modifiedAt": "2026-03-10T10:00:00", "sourceKind": "isrmAlgorithm", "ext": ".alg"},
            {"id": "ALG-002", "name": "CU_ISRM_P1.alg",  "modifiedAt": "2026-04-01T11:00:00", "sourceKind": "isrmAlgorithm", "ext": ".alg"},
            {"id": "ALG-003", "name": "CU_ISRM_P2.alg",  "modifiedAt": "2026-04-01T11:05:00", "sourceKind": "isrmAlgorithm", "ext": ".alg"},
        ],
    },
    "rtpcRecipe": {
        "sourceKind": "rtpcRecipe",
        "titleBase": "RTPC Recipe",
        "path": "/equipment/CMP-A01/rtpc",
        "exts": [".rcp"],
        "items": [
            {"id": "RTPC-001", "name": "CU_RTPC_P1.rcp", "modifiedAt": "2026-04-05T14:00:00", "sourceKind": "rtpcRecipe", "ext": ".rcp"},
        ],
    },
    "metrologyRecipe": {
        "sourceKind": "metrologyRecipe",
        "titleBase": "Metrology Recipe",
        "path": "/equipment/CMP-A01/metrology",
        "exts": [".rcp"],
        "items": [
            {"id": "MET-001", "name": "STI_PRE_METRO.rcp",     "modifiedAt": "2026-04-10T09:00:00", "sourceKind": "metrologyRecipe", "ext": ".rcp"},
            {"id": "MET-002", "name": "STI_POST_METRO.rcp",    "modifiedAt": "2026-04-10T09:05:00", "sourceKind": "metrologyRecipe", "ext": ".rcp"},
            {"id": "MET-003", "name": "W_POST_METRO.rcp",      "modifiedAt": "2026-04-12T11:00:00", "sourceKind": "metrologyRecipe", "ext": ".rcp"},
            {"id": "MET-004", "name": "CU_PRE_METRO_OX.rcp",   "modifiedAt": "2026-04-15T13:30:00", "sourceKind": "metrologyRecipe", "ext": ".rcp"},
            {"id": "MET-005", "name": "CU_POST_METRO_OX.rcp",  "modifiedAt": "2026-04-15T13:35:00", "sourceKind": "metrologyRecipe", "ext": ".rcp"},
            {"id": "MET-006", "name": "CU_POST_METRO_BAR.rcp", "modifiedAt": "2026-04-15T14:00:00", "sourceKind": "metrologyRecipe", "ext": ".rcp"},
        ],
    },
    "hcluPostLoad": {
        "sourceKind": "hcluPostLoad",
        "titleBase": "HCLU Post-Load",
        "path": "/equipment/CMP-A01/hclu",
        "exts": [".rcp"],
        "items": [
            {"id": "HCLU-001", "name": "CU_HCLU_POSTLOAD.rcp",  "modifiedAt": "2026-04-06T09:00:00", "sourceKind": "hcluPostLoad",  "ext": ".rcp"},
        ],
    },
    "hcluPreUnload": {
        "sourceKind": "hcluPreUnload",
        "titleBase": "HCLU Pre-Unload",
        "path": "/equipment/CMP-A01/hclu",
        "exts": [".rcp"],
        "items": [
            {"id": "HCLU-002", "name": "CU_HCLU_PREUNLOAD.rcp", "modifiedAt": "2026-04-06T09:05:00", "sourceKind": "hcluPreUnload", "ext": ".rcp"},
        ],
    },
}

# ---------------------------------------------------------------------------
# History entries
# HistoryEntry: { actorName, actorTeam, fromEqpId, action, toEqpId,
#                 createdAt, itemKind?, sourceName?, targetName?,
#                 recipeName?, requestId?, status?, reason?, detail? }
# ---------------------------------------------------------------------------

MOCK_HISTORY_ENTRIES: list[dict[str, Any]] = [
    {
        "actorName": "Kim Minsu",
        "actorTeam": "CMP1",
        "fromEqpId": "CMP-A01",
        "action": "transfer",
        "toEqpId": "CMP-A02",
        "createdAt": "2026-05-13T09:15:00",
        "itemKind": "job",
        "sourceName": "STI_CMP_P1.job",
        "targetName": "STI_CMP_P1.job",
        "recipeName": "STI_POL_P1_MAIN.pol",
        "requestId": "REQ-20260513-001",
        "status": "success",
        "detail": "Transferred STI job set to backup equipment before quarterly PM.",
    },
    {
        "actorName": "Lee Jiyeon",
        "actorTeam": "CMP2",
        "fromEqpId": "CMP-B01",
        "action": "transfer",
        "toEqpId": "CMP-B02",
        "createdAt": "2026-05-13T10:40:00",
        "itemKind": "cas",
        "sourceName": "MAIN.cas",
        "targetName": "MAIN.cas",
        "requestId": "REQ-20260513-002",
        "status": "success",
        "detail": "Sync MAIN.cas to redundant tool before process run.",
    },
    {
        "actorName": "Park Hyunwoo",
        "actorTeam": "CMP1",
        "fromEqpId": "CMP-A02",
        "action": "rename",
        "toEqpId": "CMP-A02",
        "createdAt": "2026-05-12T14:25:00",
        "itemKind": "recipe",
        "sourceName": "STI_POL_P1_DRAFT.pol",
        "targetName": "STI_POL_P1_MAIN.pol",
        "requestId": "REQ-20260512-005",
        "status": "success",
        "detail": "Promoted draft polish recipe to production after process qualification.",
    },
    {
        "actorName": "Choi Sooyeon",
        "actorTeam": "CMP2",
        "fromEqpId": "CMP-B03",
        "action": "delete",
        "toEqpId": "CMP-B03",
        "createdAt": "2026-05-12T16:05:00",
        "itemKind": "recipe",
        "sourceName": "W_POL_P1_OLD.pol",
        "requestId": "REQ-20260512-009",
        "status": "success",
        "detail": "Removed obsolete tungsten bulk recipe superseded by new process node.",
    },
    {
        "actorName": "Kim Minsu",
        "actorTeam": "CMP1",
        "fromEqpId": "CMP-A01",
        "action": "persist_job",
        "toEqpId": "CMP-A01",
        "createdAt": "2026-05-11T11:00:00",
        "itemKind": "job",
        "sourceName": "CU_CMP_OXIDE.job",
        "targetName": "CU_CMP_OXIDE_V2.job",
        "recipeName": "CU_POL_P1_OXIDE.pol",
        "requestId": "REQ-20260511-003",
        "status": "success",
        "detail": "Saved new job version with updated ISRM algorithm assignment.",
    },
    {
        "actorName": "Jung Daewon",
        "actorTeam": "CMP1",
        "fromEqpId": "CMP-A03",
        "action": "transfer",
        "toEqpId": "CMP-B01",
        "createdAt": "2026-05-10T08:30:00",
        "itemKind": "job",
        "sourceName": "W_CMP_BULK.job",
        "targetName": "W_CMP_BULK.job",
        "recipeName": "W_POL_P1_BULK.pol",
        "requestId": "REQ-20260510-001",
        "status": "success",
        "detail": "Cross-line job transfer for workload rebalancing.",
    },
    {
        "actorName": "Lee Jiyeon",
        "actorTeam": "CMP2",
        "fromEqpId": "CMP-B02",
        "action": "persist_cas",
        "toEqpId": "CMP-B02",
        "createdAt": "2026-05-09T15:55:00",
        "itemKind": "cas",
        "sourceName": "TEST.cas",
        "targetName": "QUAL.cas",
        "requestId": "REQ-20260509-007",
        "status": "success",
        "detail": "Promoted test CAS to qualification after lot run verification.",
    },
    {
        "actorName": "Park Hyunwoo",
        "actorTeam": "CMP1",
        "fromEqpId": "CMP-A01",
        "action": "transfer",
        "toEqpId": "CMP-A03",
        "createdAt": "2026-05-08T13:20:00",
        "itemKind": "recipe",
        "sourceName": "CU_ISRM_P1.alg",
        "targetName": "CU_ISRM_P1.alg",
        "requestId": "REQ-20260508-004",
        "status": "failed",
        "reason": "Target equipment FTP connection refused.",
        "detail": "Transfer failed due to FTP service outage on CMP-A03. Retry scheduled.",
    },
    {
        "actorName": "Choi Sooyeon",
        "actorTeam": "CMP2",
        "fromEqpId": "CMP-B04",
        "action": "rename",
        "toEqpId": "CMP-B04",
        "createdAt": "2026-05-07T10:10:00",
        "itemKind": "job",
        "sourceName": "CU_CMP_BARRIER_CLN_BACKUP.job",
        "targetName": "CU_CMP_BARRIER_CLN.job",
        "requestId": "REQ-20260507-002",
        "status": "success",
        "detail": "Renamed barrier clean job after validation on engineering lot.",
    },
    {
        "actorName": "Jung Daewon",
        "actorTeam": "CMP1",
        "fromEqpId": "CMP-A02",
        "action": "persist_job",
        "toEqpId": "CMP-A02",
        "createdAt": "2026-05-06T17:00:00",
        "itemKind": "job",
        "sourceName": "STI_CMP_P2.job",
        "targetName": "STI_CMP_P2_REV2.job",
        "recipeName": "STI_POL_P2_MAIN.pol",
        "requestId": "REQ-20260506-011",
        "status": "success",
        "detail": "Updated P2 STI job with revised conditioner sweep parameters.",
    },
]
