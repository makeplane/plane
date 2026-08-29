import os
import tempfile
from pathlib import Path
from unittest.mock import patch

from server import exec_environment, missing_apps_module, python_cmd, uv_env_dir


def test_uv_env_dir_is_outside_workdir():
    os.environ["TESTHUB_UV_ENV_ROOT"] = "/opt/testhub/uv-envs"
    os.environ["TESTHUB_WORKDIR"] = "/opt/testhub/workdir"
    dest = uv_env_dir(Path("/opt/testhub/workdir"))
    assert str(dest).replace("\\", "/") == "/opt/testhub/uv-envs/local-mount"
    other = uv_env_dir(Path("/opt/gitsync/clones/p/r"))
    assert str(other).replace("\\", "/").startswith("/opt/testhub/uv-envs/")
    assert dest != other


def test_exec_environment_sets_isolated_venv(tmp_path):
    os.environ["TESTHUB_UV_ENV_ROOT"] = str(tmp_path / "envs")
    env = exec_environment(tmp_path / "repo")
    assert env["UV_PROJECT_ENVIRONMENT"].startswith(str(tmp_path / "envs"))
    assert env["UV_LINK_MODE"] == "copy"
    assert env["PYTHONPATH"].split(os.pathsep)[0] == str(tmp_path / "repo")
    assert "PYTHONSAFEPATH" not in env


def test_python_cmd_uses_uv_directory():
    with patch("server.shutil.which", return_value="/usr/local/bin/uv"):
        cmd = python_cmd(["python", "-m", "apps.index_platform", "--out", "-"], Path("/opt/testhub/workdir"))
    assert cmd[0:3] == ["/usr/local/bin/uv", "run", "--directory"]
    assert Path(cmd[3]) == Path("/opt/testhub/workdir")
    assert cmd[4:7] == ["--no-dev", "--", "python"]


def test_missing_module_when_index_platform_absent():
    with tempfile.TemporaryDirectory() as raw:
        workdir = Path(raw)
        msg = missing_apps_module(
            workdir,
            ["python", "-m", "apps.index_platform", "--out", "-"],
        )
        assert msg is not None
        assert "apps.index_platform" in msg


def test_missing_module_ok_when_present():
    with tempfile.TemporaryDirectory() as raw:
        workdir = Path(raw)
        target = workdir / "apps" / "index_platform"
        target.mkdir(parents=True)
        (target / "__main__.py").write_text("#\n", encoding="utf-8")
        assert (
            missing_apps_module(
                workdir,
                ["python", "-m", "apps.index_platform", "--out", "-"],
            )
            is None
        )


def test_missing_packages_action_words():
    with tempfile.TemporaryDirectory() as raw:
        workdir = Path(raw)
        msg = missing_apps_module(
            workdir,
            ["python", "-m", "packages.action_words", "run", "db_seed.x"],
        )
        assert msg is not None
        assert "packages.action_words" in msg
        target = workdir / "packages" / "action_words"
        target.mkdir(parents=True)
        (target / "__main__.py").write_text("#\n", encoding="utf-8")
        assert (
            missing_apps_module(
                workdir,
                ["python", "-m", "packages.action_words", "run", "db_seed.x"],
            )
            is None
        )


def test_missing_packages_config():
    with tempfile.TemporaryDirectory() as raw:
        workdir = Path(raw)
        msg = missing_apps_module(
            workdir,
            ["python", "-m", "packages.config", "use", "dev"],
        )
        assert msg is not None
        assert "packages.config" in msg
        (workdir / "packages").mkdir()
        (workdir / "packages" / "config.py").write_text("#\n", encoding="utf-8")
        assert (
            missing_apps_module(
                workdir,
                ["python", "-m", "packages.config", "use", "dev"],
            )
            is None
        )


if __name__ == "__main__":
    test_uv_env_dir_is_outside_workdir()
    test_exec_environment_sets_isolated_venv(Path(tempfile.mkdtemp()))
    test_python_cmd_uses_uv_directory()
    test_missing_module_when_index_platform_absent()
    test_missing_module_ok_when_present()
    test_missing_packages_action_words()
    test_missing_packages_config()
    print("ok")
