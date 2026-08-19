# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from plane.testhub.files import FileAccessError, resolve_repo_file
from plane.testhub.whitelist import WhitelistError, build_argv, is_destructive

pytestmark = pytest.mark.unit

DB_SEED_TOOL = {
    "app_id": "db_seed",
    "name": "DB seed",
    "module": "apps.action_runner",
    "argv": ["python", "-m", "apps.action_runner", "run", "--expect-category", "db_seed"],
    "params_schema": {
        "type": "object",
        "properties": {
            "word_id": {"type": "string", "pattern": r"^db_seed\.[a-z][a-z0-9_]*$"},
            "params": {"type": "object"},
            "example": {"type": "boolean"},
        },
        "required": ["word_id"],
        "additionalProperties": False,
    },
    "argv_plan": [
        {"key": "word_id", "kind": "positional"},
        {"key": "params", "kind": "json_option", "flag": "--params"},
        {"key": "example", "kind": "store_true", "flag": "--example"},
    ],
    "destructive": True,
    "plane_runnable": True,
    "whitelisted": True,
    "timeout": 300,
}

DB_ASSERT_TOOL = {
    **DB_SEED_TOOL,
    "app_id": "db_assert",
    "argv": ["python", "-m", "apps.action_runner", "run", "--expect-category", "db_assert"],
    "params_schema": {
        **DB_SEED_TOOL["params_schema"],
        "properties": {
            "word_id": {"type": "string", "pattern": r"^db_assert\.[a-z][a-z0-9_]*$"},
            "params": {"type": "object"},
            "example": {"type": "boolean"},
        },
    },
    "destructive": False,
}


def test_index_platform_argv():
    assert build_argv("index_platform") == ["python", "-m", "apps.index_platform", "--out", "-"]


def test_db_seed_argv_from_catalog():
    argv = build_argv(
        "db_seed",
        {"word_id": "db_seed.create_example", "params": {"n": 1}},
        tools=[DB_SEED_TOOL],
    )
    assert argv[:6] == [
        "python",
        "-m",
        "apps.action_runner",
        "run",
        "--expect-category",
        "db_seed",
    ]
    assert argv[6] == "db_seed.create_example"
    assert argv[7] == "--params"
    assert argv[8] == '{"n": 1}'


def test_legacy_action_words_kind_maps_to_category():
    argv = build_argv(
        "action_words",
        {"word_id": "db_seed.create_example", "params": {}},
        tools=[DB_SEED_TOOL],
    )
    assert "--expect-category" in argv
    assert argv[argv.index("--expect-category") + 1] == "db_seed"


def test_rejects_unregistered_kind():
    with pytest.raises(WhitelistError):
        build_argv("dump_ddl", {"tables": ["invoice"]}, tools=[DB_SEED_TOOL])


def test_rejects_wrong_word_prefix():
    with pytest.raises(WhitelistError):
        build_argv(
            "db_assert",
            {"word_id": "db_seed.create_example"},
            tools=[DB_ASSERT_TOOL],
        )


def test_is_destructive_from_tool():
    assert is_destructive("db_seed", {"word_id": "db_seed.x"}, [DB_SEED_TOOL])
    assert not is_destructive("db_assert", {"word_id": "db_assert.x"}, [DB_ASSERT_TOOL])
    assert is_destructive("action_words", {"word_id": "db_seed.create_invoice"}, [DB_SEED_TOOL])
    assert not is_destructive("dump_ddl", {})


def test_unknown_kind():
    with pytest.raises(WhitelistError):
        build_argv("bash")


def test_overlay_is_not_a_runner_command():
    """Progress overlays live in TesthubAssetOverlay, never as a git/runner kind."""
    with pytest.raises(WhitelistError):
        build_argv("overlay")
    with pytest.raises(WhitelistError):
        build_argv("git")


def test_session_selection_keeps_only_path_and_name():
    from plane.testhub.sessions import SessionSelectionError, clean_session_selection

    cleaned = clean_session_selection(
        [
            {
                "feature_path": "billing/feature/invoice.feature",
                "scenario_name": "Create invoice",
                "body": "Given I seed invoices",
                "gherkin": "Feature: Invoice",
            }
        ]
    )
    assert cleaned == [
        {"feature_path": "billing/feature/invoice.feature", "scenario_name": "Create invoice"}
    ]
    with pytest.raises(SessionSelectionError):
        clean_session_selection({"feature_path": "x.feature"})


def test_file_allowlist(tmp_path):
    (tmp_path / "assets" / "ddl" / "main").mkdir(parents=True)
    target = tmp_path / "assets" / "ddl" / "main" / "invoice.sql"
    target.write_text("create table invoice ();\n", encoding="utf-8")
    path, content = resolve_repo_file(str(tmp_path), "assets/ddl/main/invoice.sql")
    assert path == "assets/ddl/main/invoice.sql"
    assert "create table" in content

    with pytest.raises(FileAccessError):
        resolve_repo_file(str(tmp_path), "../secrets.txt")

    with pytest.raises(FileAccessError):
        resolve_repo_file(str(tmp_path), "config/env_local.py")
