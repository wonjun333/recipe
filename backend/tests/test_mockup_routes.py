"""
Pytest test suite for CMP recipe management system mockup data.

These tests validate that every constant in mockup_data.py conforms to the
exact shape expected by the production API routes.  No real DB or FTP
connections are required — only the static mockup module is exercised.
"""

from __future__ import annotations

import sys
import os

# Allow running from repo root without installation
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tests import mockup_data as md


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _assert_file_entry(entry: dict, context: str) -> None:
    """FileEntry: { name, modifiedAt, size?, rawLine? }"""
    assert isinstance(entry.get("name"), str) and entry["name"], f"{context}: name must be non-empty str"
    assert isinstance(entry.get("modifiedAt"), str) and entry["modifiedAt"], f"{context}: modifiedAt must be non-empty str"
    # Optional fields — if present must be str
    for opt in ("size", "rawLine"):
        if opt in entry:
            assert isinstance(entry[opt], str), f"{context}: {opt} must be str when present"


def _assert_job_parsed_row(row: dict, context: str) -> None:
    """JobParsedRow: { label, p1, p2, p3 }"""
    for field in ("label", "p1", "p2", "p3"):
        assert isinstance(row.get(field), str), f"{context} polisher row missing str field '{field}'"


def _assert_cleaner_row(row: dict, context: str) -> None:
    """CleanerParsedRow: { index, module, recipe }"""
    for field in ("index", "module", "recipe"):
        assert isinstance(row.get(field), str), f"{context} cleaner row missing str field '{field}'"


def _assert_job_parsed(parsed: dict, context: str) -> None:
    """
    JobParsed: {
        preMetrology: { enabled, recipe }
        polisher: { route, rows }
        cleaner: { route, numberOfSteps, rows }
        postMetrology: { enabled, recipe }
        useHeads?: { head1, head2, head3, head4 }
        hcluRecipes?: { postLoad, preUnload }
    }
    """
    # preMetrology
    pre = parsed.get("preMetrology")
    assert isinstance(pre, dict), f"{context}: preMetrology must be dict"
    assert isinstance(pre.get("enabled"), bool), f"{context}: preMetrology.enabled must be bool"
    assert isinstance(pre.get("recipe"), str), f"{context}: preMetrology.recipe must be str"

    # polisher
    pol = parsed.get("polisher")
    assert isinstance(pol, dict), f"{context}: polisher must be dict"
    assert isinstance(pol.get("route"), bool), f"{context}: polisher.route must be bool"
    assert isinstance(pol.get("rows"), list), f"{context}: polisher.rows must be list"
    for i, row in enumerate(pol["rows"]):
        _assert_job_parsed_row(row, f"{context} polisher.rows[{i}]")

    # cleaner
    cln = parsed.get("cleaner")
    assert isinstance(cln, dict), f"{context}: cleaner must be dict"
    assert isinstance(cln.get("route"), bool), f"{context}: cleaner.route must be bool"
    assert isinstance(cln.get("numberOfSteps"), int), f"{context}: cleaner.numberOfSteps must be int"
    assert isinstance(cln.get("rows"), list), f"{context}: cleaner.rows must be list"
    assert len(cln["rows"]) == cln["numberOfSteps"], (
        f"{context}: cleaner.rows length {len(cln['rows'])} != numberOfSteps {cln['numberOfSteps']}"
    )
    for i, row in enumerate(cln["rows"]):
        _assert_cleaner_row(row, f"{context} cleaner.rows[{i}]")

    # postMetrology
    post = parsed.get("postMetrology")
    assert isinstance(post, dict), f"{context}: postMetrology must be dict"
    assert isinstance(post.get("enabled"), bool), f"{context}: postMetrology.enabled must be bool"
    assert isinstance(post.get("recipe"), str), f"{context}: postMetrology.recipe must be str"

    # useHeads (optional)
    if "useHeads" in parsed:
        heads = parsed["useHeads"]
        assert isinstance(heads, dict), f"{context}: useHeads must be dict"
        for h in ("head1", "head2", "head3", "head4"):
            assert isinstance(heads.get(h), bool), f"{context}: useHeads.{h} must be bool"

    # hcluRecipes (optional)
    if "hcluRecipes" in parsed:
        hclu = parsed["hcluRecipes"]
        assert isinstance(hclu, dict), f"{context}: hcluRecipes must be dict"
        assert isinstance(hclu.get("postLoad"), str), f"{context}: hcluRecipes.postLoad must be str"
        assert isinstance(hclu.get("preUnload"), str), f"{context}: hcluRecipes.preUnload must be str"


# ---------------------------------------------------------------------------
# EqpOptions
# ---------------------------------------------------------------------------

class TestMockEqpOptions:
    def test_top_level_keys(self):
        data = md.MOCK_EQP_OPTIONS
        for key in ("items", "lineOptions", "teamOptions", "eqpOptions"):
            assert key in data, f"MOCK_EQP_OPTIONS missing key '{key}'"

    def test_items_is_list_with_minimum_count(self):
        items = md.MOCK_EQP_OPTIONS["items"]
        assert isinstance(items, list)
        assert len(items) >= 6, "Expected at least 6 equipment items"

    def test_each_item_shape(self):
        for i, item in enumerate(md.MOCK_EQP_OPTIONS["items"]):
            ctx = f"MOCK_EQP_OPTIONS.items[{i}]"
            for required in ("line", "team", "eqpId"):
                assert isinstance(item.get(required), str) and item[required], \
                    f"{ctx}: '{required}' must be non-empty str"
            for optional in ("model", "maker", "modelGroup"):
                if optional in item:
                    assert isinstance(item[optional], str), f"{ctx}: '{optional}' must be str"

    def test_line_options_are_strings(self):
        for opt in md.MOCK_EQP_OPTIONS["lineOptions"]:
            assert isinstance(opt, str) and opt

    def test_team_options_are_strings(self):
        for opt in md.MOCK_EQP_OPTIONS["teamOptions"]:
            assert isinstance(opt, str) and opt

    def test_eqp_options_are_strings(self):
        for opt in md.MOCK_EQP_OPTIONS["eqpOptions"]:
            assert isinstance(opt, str) and opt

    def test_line_options_derived_from_items(self):
        item_lines = {item["line"] for item in md.MOCK_EQP_OPTIONS["items"]}
        list_lines = set(md.MOCK_EQP_OPTIONS["lineOptions"])
        assert item_lines == list_lines

    def test_eqp_options_derived_from_items(self):
        item_eqps = {item["eqpId"] for item in md.MOCK_EQP_OPTIONS["items"]}
        list_eqps = set(md.MOCK_EQP_OPTIONS["eqpOptions"])
        assert item_eqps == list_eqps

    def test_realistic_eqp_id_format(self):
        for opt in md.MOCK_EQP_OPTIONS["eqpOptions"]:
            assert opt.startswith("CMP-"), f"Expected CMP- prefix, got '{opt}'"


# ---------------------------------------------------------------------------
# CAS list (FileEntry[])
# ---------------------------------------------------------------------------

class TestMockCasList:
    def test_minimum_count(self):
        assert len(md.MOCK_CAS_LIST) >= 4, "Expected at least 4 CAS entries"

    def test_each_entry_is_file_entry(self):
        for i, entry in enumerate(md.MOCK_CAS_LIST):
            _assert_file_entry(entry, f"MOCK_CAS_LIST[{i}]")

    def test_all_names_end_with_cas(self):
        for entry in md.MOCK_CAS_LIST:
            assert entry["name"].lower().endswith(".cas"), \
                f"CAS list entry '{entry['name']}' should end with .cas"


# ---------------------------------------------------------------------------
# JOB list
# ---------------------------------------------------------------------------

class TestMockJobList:
    def test_minimum_count(self):
        assert len(md.MOCK_JOB_LIST) >= 6, "Expected at least 6 JOB entries"

    def test_each_entry_shape(self):
        for i, entry in enumerate(md.MOCK_JOB_LIST):
            ctx = f"MOCK_JOB_LIST[{i}]"
            for field in ("id", "jobName", "recipeName", "modifiedAt"):
                assert isinstance(entry.get(field), str) and entry[field], \
                    f"{ctx}: '{field}' must be non-empty str"

    def test_ids_are_unique(self):
        ids = [e["id"] for e in md.MOCK_JOB_LIST]
        assert len(ids) == len(set(ids)), "JOB list IDs must be unique"

    def test_job_names_end_with_job(self):
        for entry in md.MOCK_JOB_LIST:
            assert entry["jobName"].lower().endswith(".job"), \
                f"Job name '{entry['jobName']}' should end with .job"


# ---------------------------------------------------------------------------
# CAS content
# ---------------------------------------------------------------------------

class TestMockCasContent:
    def test_keys_match_cas_list(self):
        cas_names = {e["name"] for e in md.MOCK_CAS_LIST}
        content_keys = set(md.MOCK_CAS_CONTENT.keys())
        assert content_keys == cas_names, \
            f"MOCK_CAS_CONTENT keys {content_keys} must match CAS list names {cas_names}"

    def test_each_entry_has_required_fields(self):
        for cas_id, content in md.MOCK_CAS_CONTENT.items():
            ctx = f"MOCK_CAS_CONTENT['{cas_id}']"
            assert isinstance(content.get("casId"), str), f"{ctx}: casId must be str"
            assert content["casId"] == cas_id, f"{ctx}: casId must equal dict key"
            assert isinstance(content.get("slots"), list), f"{ctx}: slots must be list"

    def test_each_cas_has_exactly_25_slots(self):
        for cas_id, content in md.MOCK_CAS_CONTENT.items():
            slots = content["slots"]
            assert len(slots) == 25, \
                f"MOCK_CAS_CONTENT['{cas_id}'] must have exactly 25 slots, got {len(slots)}"

    def test_slot_numbers_are_1_to_25(self):
        for cas_id, content in md.MOCK_CAS_CONTENT.items():
            slot_nums = [s["slot"] for s in content["slots"]]
            assert slot_nums == list(range(1, 26)), \
                f"MOCK_CAS_CONTENT['{cas_id}'] slots must be numbered 1-25 in order"

    def test_each_slot_shape(self):
        for cas_id, content in md.MOCK_CAS_CONTENT.items():
            for s in content["slots"]:
                ctx = f"MOCK_CAS_CONTENT['{cas_id}'] slot {s.get('slot')}"
                assert isinstance(s.get("slot"), int), f"{ctx}: slot must be int"
                assert isinstance(s.get("jobId"), str), f"{ctx}: jobId must be str"
                assert isinstance(s.get("jobName"), str), f"{ctx}: jobName must be str"
                assert isinstance(s.get("recipeName"), str), f"{ctx}: recipeName must be str"

    def test_occupied_slots_have_nonempty_job_ids(self):
        for cas_id, content in md.MOCK_CAS_CONTENT.items():
            for s in content["slots"]:
                if s["jobName"] != "(None)":
                    assert s["jobId"], \
                        f"MOCK_CAS_CONTENT['{cas_id}'] slot {s['slot']}: non-None job must have jobId"

    def test_job_ids_field_when_present(self):
        for cas_id, content in md.MOCK_CAS_CONTENT.items():
            if "jobIds" in content:
                assert isinstance(content["jobIds"], list), \
                    f"MOCK_CAS_CONTENT['{cas_id}'].jobIds must be list"
                for jid in content["jobIds"]:
                    assert isinstance(jid, str) and jid, \
                        f"MOCK_CAS_CONTENT['{cas_id}'].jobIds items must be non-empty str"


# ---------------------------------------------------------------------------
# JOB content
# ---------------------------------------------------------------------------

class TestMockJobContent:
    def test_keys_match_job_list(self):
        job_ids = {e["id"] for e in md.MOCK_JOB_LIST}
        content_keys = set(md.MOCK_JOB_CONTENT.keys())
        assert content_keys == job_ids, \
            f"MOCK_JOB_CONTENT keys {content_keys} must match job list IDs {job_ids}"

    def test_each_entry_has_required_top_level_fields(self):
        for job_id, content in md.MOCK_JOB_CONTENT.items():
            ctx = f"MOCK_JOB_CONTENT['{job_id}']"
            assert isinstance(content.get("jobId"), str), f"{ctx}: jobId must be str"
            assert content["jobId"] == job_id, f"{ctx}: jobId must equal dict key"
            assert isinstance(content.get("jobName"), str), f"{ctx}: jobName must be str"
            assert isinstance(content.get("baseRecipeName"), str), f"{ctx}: baseRecipeName must be str"
            assert isinstance(content.get("parsed"), dict), f"{ctx}: parsed must be dict"

    def test_parsed_structure(self):
        for job_id, content in md.MOCK_JOB_CONTENT.items():
            _assert_job_parsed(content["parsed"], f"MOCK_JOB_CONTENT['{job_id}'].parsed")

    def test_polisher_rows_have_standard_labels(self):
        expected_labels = [
            "Polish Recipe", "Condition Recipe", "Ex Situ Condition",
            "Special Ex Situ", "ISRM Algorithm", "WL Algorithm",
            "RTPC Recipe", "PRC Algorithm", "FT Algorithm",
        ]
        for job_id, content in md.MOCK_JOB_CONTENT.items():
            rows = content["parsed"]["polisher"]["rows"]
            actual_labels = [r["label"] for r in rows]
            assert actual_labels == expected_labels, \
                f"MOCK_JOB_CONTENT['{job_id}'] polisher row labels mismatch: {actual_labels}"

    def test_cleaner_station_ids_are_known(self):
        known_stations = {"CIN", "BR1", "BR2", "DRYER", "MEG", "COUT"}
        for job_id, content in md.MOCK_JOB_CONTENT.items():
            for row in content["parsed"]["cleaner"]["rows"]:
                assert row["module"] in known_stations, \
                    f"MOCK_JOB_CONTENT['{job_id}'] cleaner module '{row['module']}' not in {known_stations}"


# ---------------------------------------------------------------------------
# Recipe source list
# ---------------------------------------------------------------------------

class TestMockRecipeSourceList:
    VALID_SOURCE_KINDS = {
        "recipe", "polishRecipe", "conditionRecipe", "exSituCondition",
        "specialExSitu", "isrmAlgorithm", "rtpcRecipe", "hcluPostLoad",
        "hcluPreUnload", "megasonics", "brush1", "brush2", "vaporDryer",
        "metrologyRecipe",
    }

    def test_all_keys_are_valid_source_kinds(self):
        for key in md.MOCK_RECIPE_SOURCE_LIST:
            assert key in self.VALID_SOURCE_KINDS, \
                f"MOCK_RECIPE_SOURCE_LIST key '{key}' is not a valid RecipeSourceKind"

    def test_each_entry_shape(self):
        for kind, data in md.MOCK_RECIPE_SOURCE_LIST.items():
            ctx = f"MOCK_RECIPE_SOURCE_LIST['{kind}']"
            assert isinstance(data.get("sourceKind"), str), f"{ctx}: sourceKind must be str"
            assert data["sourceKind"] == kind, f"{ctx}: sourceKind must equal dict key"
            assert isinstance(data.get("titleBase"), str), f"{ctx}: titleBase must be str"
            assert isinstance(data.get("path"), str), f"{ctx}: path must be str"
            assert isinstance(data.get("exts"), list), f"{ctx}: exts must be list"
            assert isinstance(data.get("items"), list), f"{ctx}: items must be list"

    def test_each_item_shape(self):
        for kind, data in md.MOCK_RECIPE_SOURCE_LIST.items():
            for i, item in enumerate(data["items"]):
                ctx = f"MOCK_RECIPE_SOURCE_LIST['{kind}'].items[{i}]"
                for field in ("id", "name", "modifiedAt", "sourceKind"):
                    assert isinstance(item.get(field), str) and item[field], \
                        f"{ctx}: '{field}' must be non-empty str"
                assert item["sourceKind"] == kind, \
                    f"{ctx}: item.sourceKind must match parent key"
                if "ext" in item:
                    assert isinstance(item["ext"], str), f"{ctx}: ext must be str"

    def test_item_ids_are_unique_per_kind(self):
        for kind, data in md.MOCK_RECIPE_SOURCE_LIST.items():
            ids = [item["id"] for item in data["items"]]
            assert len(ids) == len(set(ids)), \
                f"MOCK_RECIPE_SOURCE_LIST['{kind}'] contains duplicate item IDs"


# ---------------------------------------------------------------------------
# History entries
# ---------------------------------------------------------------------------

class TestMockHistoryEntries:
    VALID_ACTIONS = {"transfer", "rename", "delete", "persist_cas", "persist_job", "clone"}

    def test_minimum_count(self):
        assert len(md.MOCK_HISTORY_ENTRIES) >= 10, "Expected at least 10 history entries"

    def test_each_entry_required_fields(self):
        for i, entry in enumerate(md.MOCK_HISTORY_ENTRIES):
            ctx = f"MOCK_HISTORY_ENTRIES[{i}]"
            for field in ("actorName", "actorTeam", "fromEqpId", "action", "toEqpId", "createdAt"):
                assert isinstance(entry.get(field), str) and entry[field], \
                    f"{ctx}: '{field}' must be non-empty str"

    def test_each_entry_optional_fields_type(self):
        optional_str_fields = (
            "itemKind", "sourceName", "targetName", "recipeName",
            "requestId", "status", "reason", "detail",
        )
        for i, entry in enumerate(md.MOCK_HISTORY_ENTRIES):
            ctx = f"MOCK_HISTORY_ENTRIES[{i}]"
            for field in optional_str_fields:
                if field in entry:
                    assert isinstance(entry[field], str), \
                        f"{ctx}: optional field '{field}' must be str when present"

    def test_actions_are_known(self):
        for i, entry in enumerate(md.MOCK_HISTORY_ENTRIES):
            assert entry["action"] in self.VALID_ACTIONS, \
                f"MOCK_HISTORY_ENTRIES[{i}]: action '{entry['action']}' not in {self.VALID_ACTIONS}"

    def test_eqp_ids_reference_known_equipment(self):
        known_eqps = set(md.MOCK_EQP_OPTIONS["eqpOptions"])
        for i, entry in enumerate(md.MOCK_HISTORY_ENTRIES):
            for field in ("fromEqpId", "toEqpId"):
                assert entry[field] in known_eqps, \
                    f"MOCK_HISTORY_ENTRIES[{i}].{field} '{entry[field]}' not in known equipment {known_eqps}"

    def test_created_at_is_iso_format(self):
        import re
        iso_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")
        for i, entry in enumerate(md.MOCK_HISTORY_ENTRIES):
            assert iso_pattern.match(entry["createdAt"]), \
                f"MOCK_HISTORY_ENTRIES[{i}].createdAt '{entry['createdAt']}' is not ISO 8601"

    def test_status_values_are_valid(self):
        valid_statuses = {"success", "failed", "pending"}
        for i, entry in enumerate(md.MOCK_HISTORY_ENTRIES):
            if "status" in entry:
                assert entry["status"] in valid_statuses, \
                    f"MOCK_HISTORY_ENTRIES[{i}].status '{entry['status']}' not in {valid_statuses}"

    def test_failed_entries_have_reason(self):
        for i, entry in enumerate(md.MOCK_HISTORY_ENTRIES):
            if entry.get("status") == "failed":
                assert "reason" in entry, \
                    f"MOCK_HISTORY_ENTRIES[{i}]: failed entries should have a reason"


# ---------------------------------------------------------------------------
# Cross-dataset consistency checks
# ---------------------------------------------------------------------------

class TestCrossDatasetConsistency:
    def test_cas_content_job_ids_exist_in_job_list(self):
        known_job_ids = {e["id"] for e in md.MOCK_JOB_LIST} | {""}
        for cas_id, content in md.MOCK_CAS_CONTENT.items():
            for slot in content["slots"]:
                assert slot["jobId"] in known_job_ids, (
                    f"MOCK_CAS_CONTENT['{cas_id}'] slot {slot['slot']} "
                    f"references unknown jobId '{slot['jobId']}'"
                )

    def test_job_content_base_recipe_names_end_with_pol(self):
        for job_id, content in md.MOCK_JOB_CONTENT.items():
            base = content["baseRecipeName"]
            assert base.lower().endswith(".pol"), \
                f"MOCK_JOB_CONTENT['{job_id}'].baseRecipeName '{base}' should end with .pol"

    def test_cas_content_jobids_field_matches_occupied_slots(self):
        for cas_id, content in md.MOCK_CAS_CONTENT.items():
            if "jobIds" not in content:
                continue
            occupied = {s["jobId"] for s in content["slots"] if s["jobId"]}
            declared = set(content["jobIds"])
            assert declared == occupied, (
                f"MOCK_CAS_CONTENT['{cas_id}'].jobIds {declared} "
                f"does not match occupied slot jobIds {occupied}"
            )
