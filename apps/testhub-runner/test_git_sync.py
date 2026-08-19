from git_sync import (
    GitSyncError,
    assert_clone_workdir,
    clone_command,
    clone_or_fetch,
    origin_urls_match,
    resolve_exec_workdir,
    validate_branch,
    validate_https_repo_url,
)


def test_clone_command_is_fixed():
    cmd = clone_command(
        "https://github.com/chenjianpeng97/Repo-as-a-TestPlatform.git",
        "plane-dogfood",
        "/opt/gitsync/clones/p/r",
    )
    assert cmd[0:3] == ["git", "clone", "--branch"]
    assert cmd[3] == "plane-dogfood"
    assert "--single-branch" in cmd
    assert "--depth" in cmd
    assert "--" in cmd
    assert cmd[-2].startswith("https://")
    assert "-c" not in cmd


def test_rejects_credential_url():
    try:
        validate_https_repo_url("https://user:token@github.com/org/repo.git")
    except GitSyncError:
        return
    raise AssertionError("expected GitSyncError")


def test_rejects_non_https():
    try:
        validate_https_repo_url("git@github.com:org/repo.git")
    except GitSyncError:
        return
    raise AssertionError("expected GitSyncError")


def test_accepts_public_https():
    url = "https://github.com/chenjianpeng97/Repo-as-a-TestPlatform.git"
    assert validate_https_repo_url(url) == url
    assert validate_branch("plane-dogfood") == "plane-dogfood"


def test_rejects_workdir_traversal():
    try:
        assert_clone_workdir("/opt/gitsync/clones/../etc/passwd")
    except GitSyncError:
        return
    raise AssertionError("expected GitSyncError")


def test_rejects_workdir_outside_root():
    try:
        assert_clone_workdir("/tmp/evil")
    except GitSyncError:
        return
    raise AssertionError("expected GitSyncError")


def test_accepts_clone_subdir():
    path = assert_clone_workdir("/opt/gitsync/clones/proj/remote")
    assert str(path).replace("\\", "/").endswith("/opt/gitsync/clones/proj/remote")


def test_origin_urls_match():
    assert origin_urls_match(
        "https://github.com/org/repo.git",
        "https://github.com/org/repo",
    )
    assert not origin_urls_match(
        "https://github.com/org/repo.git",
        "https://github.com/other/repo.git",
    )


def test_exec_workdir_allowlist():
    default = resolve_exec_workdir(None, __import__("pathlib").Path("/opt/testhub/workdir"))
    assert str(default).replace("\\", "/").endswith("/opt/testhub/workdir")
    clone = resolve_exec_workdir("/opt/gitsync/clones/p/r", default)
    assert str(clone).replace("\\", "/").endswith("/opt/gitsync/clones/p/r")
    try:
        resolve_exec_workdir("/etc/passwd", default)
    except GitSyncError:
        return
    raise AssertionError("expected GitSyncError")


def test_origin_mismatch_fails():
    import tempfile
    from pathlib import Path
    from unittest.mock import patch

    dest = Path(tempfile.mkdtemp()) / "clone"
    dest.mkdir()
    (dest / ".git").mkdir()

    class Fake:
        returncode = 0
        stdout = "https://github.com/other/repo.git\n"
        stderr = ""

    def fake_run(argv, timeout):
        if argv[:5] == ["git", "-C", str(dest), "config", "--get"]:
            return Fake()
        raise AssertionError(f"unexpected argv {argv}")

    with (
        patch("git_sync.assert_clone_workdir", return_value=dest),
        patch("git_sync.run_git", fake_run),
    ):
        try:
            clone_or_fetch(
                repo_url="https://github.com/chenjianpeng97/Repo-as-a-TestPlatform.git",
                branch="plane-dogfood",
                workdir=str(dest),
            )
        except GitSyncError as exc:
            if "origin" not in str(exc):
                raise AssertionError(str(exc))
            return
        raise AssertionError("expected GitSyncError")


if __name__ == "__main__":
    test_clone_command_is_fixed()
    test_rejects_credential_url()
    test_rejects_non_https()
    test_accepts_public_https()
    test_rejects_workdir_traversal()
    test_rejects_workdir_outside_root()
    test_accepts_clone_subdir()
    test_origin_urls_match()
    test_exec_workdir_allowlist()
    test_origin_mismatch_fails()
    print("ok")
