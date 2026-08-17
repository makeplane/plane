# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.gitsync.registry import MODULE_KEYS, MODULE_REGISTRY, MODULE_TESTHUB, is_known_module, module_catalog
from plane.gitsync.workdir import (
    GitUrlNotImplemented,
    WorkdirError,
    assert_allowed_workdir,
    ensure_workdir_ready,
    read_git_meta,
    reserved_clone_workdir,
)

pytestmark = pytest.mark.unit


def test_module_registry_is_read_only_git():
    catalog = module_catalog()
    assert [item["key"] for item in catalog] == list(MODULE_KEYS)
    for item in catalog:
        assert item["source"] == "git_sync"
        assert item["mutate_git"] is False
    assert "exec_whitelist" in MODULE_REGISTRY[MODULE_TESTHUB]["capabilities"]
    assert is_known_module("testhub")
    assert not is_known_module("issues")


def test_workdir_allowlist():
    assert assert_allowed_workdir("/opt/testhub/workdir") == "/opt/testhub/workdir"
    assert assert_allowed_workdir("/opt/gitsync/clones/abc/def") == "/opt/gitsync/clones/abc/def"
    with pytest.raises(WorkdirError):
        assert_allowed_workdir("/etc/passwd")
    with pytest.raises(WorkdirError):
        assert_allowed_workdir("../secret")


def test_read_git_meta(tmp_path):
    git_dir = tmp_path / ".git"
    git_dir.mkdir()
    (git_dir / "HEAD").write_text("ref: refs/heads/sandbox/jafron\n", encoding="utf-8")
    ref = git_dir / "refs" / "heads" / "sandbox"
    ref.mkdir(parents=True)
    (ref / "jafron").write_text("abc123def\n", encoding="utf-8")
    meta = read_git_meta(tmp_path)
    assert meta["branch"] == "sandbox/jafron"
    assert meta["sha"] == "abc123def"


def test_reserved_clone_path_and_git_url_error():
    path = reserved_clone_workdir("proj", "remote")
    assert path.startswith("/opt/gitsync/clones/")
    assert "proj" in path
    assert isinstance(GitUrlNotImplemented("git_url clone/fetch is not implemented yet."), GitUrlNotImplemented)


def test_git_url_workdir_not_ready_until_cloned():
    reserved = reserved_clone_workdir("proj", "remote")
    with pytest.raises(GitUrlNotImplemented):
        ensure_workdir_ready("git_url", reserved)
    assert ensure_workdir_ready("local_mount", "/opt/testhub/workdir") == "/opt/testhub/workdir"


def test_git_url_workdir_ready_when_clone_exists(monkeypatch):
    from pathlib import Path

    reserved = reserved_clone_workdir("proj", "remote")

    def fake_is_dir(self):
        return str(self).replace("\\", "/") == reserved

    monkeypatch.setattr(Path, "is_dir", fake_is_dir)
    assert ensure_workdir_ready("git_url", reserved) == reserved
