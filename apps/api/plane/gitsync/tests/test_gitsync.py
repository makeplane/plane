# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.gitsync.registry import MODULE_KEYS, MODULE_REGISTRY, MODULE_ENVIRONMENTS, MODULE_TESTHUB, is_known_module, module_catalog
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
    assert is_known_module(MODULE_ENVIRONMENTS)
    assert "environments" in MODULE_KEYS
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


def test_scan_features_and_environments(tmp_path):
    from plane.gitsync.conventions import scan_module_catalog, scan_sql_files
    from plane.gitsync.files import FileAccessError, redact_secrets, resolve_module_file

    feature_dir = tmp_path / "billing" / "feature"
    feature_dir.mkdir(parents=True)
    (feature_dir / "invoice.feature").write_text(
        "@api\nFeature: Invoice\n  @smoke\n  Scenario: Create invoice\n",
        encoding="utf-8",
    )
    words = tmp_path / "packages" / "action_words" / "db_seed"
    words.mkdir(parents=True)
    (words / "create_invoice.py").write_text("def run():\n    pass\n", encoding="utf-8")
    (tmp_path / "packages" / "api_objects").mkdir(parents=True)
    (tmp_path / "packages" / "api_objects" / "create_invoice.py").write_text(
        'method = "POST"\npath = "/invoices"\n',
        encoding="utf-8",
    )
    env_dir = tmp_path / "config"
    env_dir.mkdir()
    (env_dir / "env.py").write_text(
        'API_BASE_URL = "https://sut.example"\nARGON_DB_HOST = "db.internal"\nARGON_DB_PASSWORD = "s3cret"\n',
        encoding="utf-8",
    )
    (env_dir / "env_local.py").write_text('PASSWORD = "nope"\n', encoding="utf-8")
    ddl = tmp_path / "assets" / "ddl" / "main"
    ddl.mkdir(parents=True)
    (ddl / "invoice.sql").write_text("create table invoice ();\n", encoding="utf-8")
    sql_dir = tmp_path / "assets" / "sql"
    sql_dir.mkdir(parents=True)
    (sql_dir / "seed_invoice.sql").write_text("select 1;\n", encoding="utf-8")

    features = scan_module_catalog("features", str(tmp_path))
    assert features["counts"]["features"] == 1
    assert features["features"][0]["name"] == "Invoice"
    assert features["features"][0]["scenarios"][0]["name"] == "Create invoice"
    assert "action_words" not in (features.get("components") or {})
    assert "api_objects" not in (features.get("components") or {})
    assert features["knowledge"]["ddl"][0]["datasource"] == "main"
    assert features["counts"]["ddl_tables"] == 1
    _, ddl_text = resolve_module_file(str(tmp_path), "features", "assets/ddl/main/invoice.sql")
    assert "invoice" in ddl_text

    environments = scan_module_catalog("environments", str(tmp_path))
    env = environments["environments"][0]
    assert env["targets"][0]["base_url"] == "https://sut.example"
    assert "ARGON_DB_PASSWORD" in env["secret_keys"]
    assert all(item["key"] != "ARGON_DB_PASSWORD" for item in env["variables"])
    assert "knowledge" not in environments

    assert scan_sql_files(str(tmp_path))[0]["name"] == "seed_invoice.sql"

    path, content = resolve_module_file(str(tmp_path), "features", "billing/feature/invoice.feature")
    assert "Feature: Invoice" in content
    _, env_text = resolve_module_file(str(tmp_path), "environments", "config/env.py")
    assert "***" in env_text
    assert "s3cret" not in env_text
    with pytest.raises(FileAccessError):
        resolve_module_file(str(tmp_path), "environments", "config/env_local.py")
    with pytest.raises(FileAccessError):
        resolve_module_file(str(tmp_path), "environments", "assets/ddl/main/invoice.sql")
    assert "PASSWORD" in redact_secrets('PASSWORD = "x"\n')


def test_scan_named_environments_redacts_secrets(tmp_path):
    from plane.gitsync.conventions import scan_module_catalog
    from plane.gitsync.env_catalog import read_env_local_payload
    from plane.gitsync.files import FileAccessError, resolve_module_file

    config = tmp_path / "config"
    config.mkdir()
    (config / "env.py").write_text(
        "DATABASES = {\n"
        '    "main": {"type": "mysql", "host": "127.0.0.1", "port": 3306,'
        ' "user": "root", "password": "CHANGE_ME", "database": "example"}\n'
        "}\n"
        'TEST_BASE_URL = ""\n',
        encoding="utf-8",
    )
    (config / "env_local.py").write_text(
        "ACTIVE_ENV = \"dev\"\n"
        "ENVIRONMENTS = {\n"
        '    "dev": {\n'
        '        "DATABASES": {"main": {"host": "10.0.0.1", "password": "s3cret", "database": "app_dev"}},\n'
        '        "TEST_BASE_URL": "http://127.0.0.1:8080",\n'
        '        "TEST_ACCOUNT": {"username": "admin", "password": "pw"},\n'
        "    },\n"
        '    "uat": {\n'
        '        "DATABASES": {"main": {"host": "10.0.0.2", "password": "other", "database": "app_uat"}},\n'
        '        "TEST_BASE_URL": "http://127.0.0.1:8081",\n'
        "    },\n"
        "}\n",
        encoding="utf-8",
    )
    (config / ".active_env").write_text("uat\n", encoding="utf-8")

    payload = scan_module_catalog("environments", str(tmp_path))
    assert payload["mode"] == "named"
    assert payload["active_env"] == "uat"
    assert payload["env_local_present"] is True
    ids = [item["id"] for item in payload["environments"]]
    assert ids == ["dev", "uat"]
    uat = payload["environments"][1]
    assert uat["active"] is True
    assert uat["targets"][0]["base_url"] == "http://127.0.0.1:8081"
    assert uat["datasources"][0]["alias"] == "main"
    assert uat["datasources"][0]["engine"] == "mysql"
    assert uat["datasources"][0]["host"] == "10.0.0.2"
    assert uat["datasources"][0]["database"] == "app_uat"
    assert "s3cret" not in str(payload)
    assert "pw" not in str(uat)
    assert any("password" in key for key in uat["secret_keys"])

    with pytest.raises(FileAccessError):
        resolve_module_file(str(tmp_path), "environments", "config/env_local.py")
    local = read_env_local_payload(str(tmp_path))
    assert local["exists"] is True
    assert "s3cret" in local["content"]


def test_scan_named_environments_falls_back_to_example(tmp_path):
    from plane.gitsync.conventions import scan_module_catalog

    config = tmp_path / "config"
    config.mkdir()
    (config / "env.py").write_text(
        'DATABASES = {"main": {"type": "postgres", "host": "127.0.0.1", "database": "example", "password": "x"}}\n',
        encoding="utf-8",
    )
    (config / "env_local.py.example").write_text(
        "ENVIRONMENTS = {\n"
        '    "dev": {"DATABASES": {"main": {"host": "127.0.0.1"}}, "TEST_BASE_URL": "http://localhost:8000"}\n'
        "}\n",
        encoding="utf-8",
    )
    payload = scan_module_catalog("environments", str(tmp_path))
    assert payload["environments"][0]["id"] == "dev"
    assert payload["env_local_present"] is False
    assert payload["environments"][0]["source"] == "config/env_local.py.example"


def test_https_repo_url_validation():
    from plane.gitsync.git_url import GitUrlError, validate_branch, validate_https_repo_url

    url = "https://github.com/chenjianpeng97/Repo-as-a-TestPlatform.git"
    assert validate_https_repo_url(url) == url
    assert validate_branch("plane-dogfood") == "plane-dogfood"
    with pytest.raises(GitUrlError):
        validate_https_repo_url("https://user:token@github.com/org/repo.git")
    with pytest.raises(GitUrlError):
        validate_https_repo_url("git@github.com:org/repo.git")
    with pytest.raises(GitUrlError):
        validate_branch("-evil")
    with pytest.raises(GitUrlError):
        validate_branch("../main")


def test_git_url_serializer_rejects_credentials():
    from plane.gitsync.serializers import ProjectGitRemoteSerializer

    serializer = ProjectGitRemoteSerializer(
        data={
            "name": "Dogfood",
            "kind": "git_url",
            "repo_url": "https://github.com/chenjianpeng97/Repo-as-a-TestPlatform.git",
            "branch": "plane-dogfood",
            "credential_ref": "vault:github",
        }
    )
    assert not serializer.is_valid()
    assert "credential_ref" in serializer.errors


def test_git_url_serializer_accepts_public_https():
    from plane.gitsync.serializers import ProjectGitRemoteSerializer

    serializer = ProjectGitRemoteSerializer(
        data={
            "name": "Dogfood",
            "kind": "git_url",
            "repo_url": "https://github.com/chenjianpeng97/Repo-as-a-TestPlatform.git",
            "branch": "plane-dogfood",
        }
    )
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data.get("credential_ref", "") == ""


def test_refresh_remote_does_not_clone_git_url():
    from types import SimpleNamespace

    from plane.gitsync.models import ProjectGitRemote
    from plane.gitsync.sync import refresh_remote

    remote = SimpleNamespace(kind=ProjectGitRemote.Kind.GIT_URL)
    with pytest.raises(ValueError, match="queue_git_url_sync"):
        refresh_remote(remote)


def test_testhub_module_is_not_convention_scanned(tmp_path):
    from plane.gitsync.conventions import ConventionError, scan_module_catalog

    with pytest.raises(ConventionError):
        scan_module_catalog("testhub", str(tmp_path))
