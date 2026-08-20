# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from plane.testhub.files import FileAccessError, resolve_repo_file
from plane.testhub.whitelist import WhitelistError, build_argv, is_destructive

pytestmark = pytest.mark.unit

DB_SEED_WORD = {
    "word_id": "db_seed.create_example",
    "name": "create example",
    "category": "db_seed",
    "plane_kind": "db_seed",
    "plane_runnable": True,
    "destructive": True,
    "timeout": 300,
    "module": "packages.action_words",
    "argv": ["python", "-m", "packages.action_words", "run"],
    "argv_plan": [
        {"key": "word_id", "kind": "positional"},
        {"key": "params", "kind": "json_option", "flag": "--params"},
        {"key": "example", "kind": "store_true", "flag": "--example"},
    ],
    "job_params_schema": {
        "type": "object",
        "properties": {
            "word_id": {"type": "string", "pattern": r"^db_seed\.[a-z][a-z0-9_]*$"},
            "params": {"type": "object"},
            "example": {"type": "boolean"},
        },
        "required": ["word_id"],
        "additionalProperties": False,
    },
}

DB_ASSERT_WORD = {
    **DB_SEED_WORD,
    "word_id": "db_assert.plane_example",
    "category": "db_assert",
    "plane_kind": "db_assert",
    "destructive": False,
    "timeout": 180,
    "job_params_schema": {
        "type": "object",
        "properties": {
            "word_id": {"type": "string", "pattern": r"^db_assert\.[a-z][a-z0-9_]*$"},
            "params": {"type": "object"},
            "example": {"type": "boolean"},
        },
        "required": ["word_id"],
        "additionalProperties": False,
    },
}

INDEX_APP = {
    "app_id": "index_platform",
    "name": "index",
    "argv": ["python", "-m", "apps.index_platform", "--out", "-"],
    "destructive": False,
    "plane_runnable": False,
}

CATALOG = {
    "tools": [INDEX_APP],
    "components": {"action_words": [DB_SEED_WORD, DB_ASSERT_WORD]},
}


def test_index_platform_argv():
    assert build_argv("index_platform") == ["python", "-m", "apps.index_platform", "--out", "-"]


def test_db_seed_argv_from_catalog():
    argv = build_argv(
        "db_seed",
        {"word_id": "db_seed.create_example", "params": {"n": 1}},
        catalog=CATALOG,
    )
    assert argv[:4] == ["python", "-m", "packages.action_words", "run"]
    assert argv[4] == "db_seed.create_example"
    assert argv[5] == "--params"
    assert argv[6] == '{"n": 1}'


def test_legacy_action_words_kind_maps_to_category():
    argv = build_argv(
        "action_words",
        {"word_id": "db_seed.create_example", "params": {}},
        catalog=CATALOG,
    )
    assert argv[:4] == ["python", "-m", "packages.action_words", "run"]
    assert argv[4] == "db_seed.create_example"


def test_rejects_unregistered_kind():
    with pytest.raises(WhitelistError):
        build_argv("dump_ddl", {"tables": ["invoice"]}, catalog=CATALOG)


def test_rejects_wrong_word_prefix():
    with pytest.raises(WhitelistError):
        build_argv(
            "db_assert",
            {"word_id": "db_seed.create_example"},
            catalog=CATALOG,
        )


def test_is_destructive_from_word():
    assert is_destructive("db_seed", {"word_id": "db_seed.create_example"}, catalog=CATALOG)
    assert not is_destructive("db_assert", {"word_id": "db_assert.plane_example"}, catalog=CATALOG)
    assert is_destructive("action_words", {"word_id": "db_seed.create_example"}, catalog=CATALOG)
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
