# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from plane.testhub.files import FileAccessError, resolve_repo_file
from plane.testhub.whitelist import WhitelistError, build_argv, is_destructive

pytestmark = pytest.mark.unit


def test_index_platform_argv():
    assert build_argv("index_platform") == ["python", "-m", "apps.index_platform", "--out", "-"]


def test_dump_ddl_argv():
    argv = build_argv("dump_ddl", {"tables": ["invoice"], "datasource": "cdcs"})
    assert argv == ["python", "apps/dump_ddl.py", "--datasource", "cdcs", "invoice"]


def test_dump_ddl_all():
    argv = build_argv("dump_ddl", {"all": True, "datasource": "main"})
    assert argv == ["python", "apps/dump_ddl.py", "--datasource", "main", "--all"]


def test_dump_ddl_rejects_bad_table():
    with pytest.raises(WhitelistError):
        build_argv("dump_ddl", {"tables": ["invoice; rm -rf /"]})


def test_action_words_requires_confirm_kind():
    assert is_destructive("action_words", {"word_id": "db_seed.create_invoice"})
    assert not is_destructive("dump_ddl", {})
    assert not is_destructive("action_words", {"word_id": "db_assert.audit_task_results"})


def test_unknown_kind():
    with pytest.raises(WhitelistError):
        build_argv("bash")


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
