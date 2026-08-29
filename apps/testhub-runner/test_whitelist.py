from whitelist import validate_argv, validate_local_file_content, validate_local_file_path


def test_allows_index_platform():
    argv = ["python", "-m", "apps.index_platform", "--out", "-"]
    assert validate_argv(argv) == argv


def test_allows_packages_action_words():
    argv = ["python", "-m", "packages.action_words", "run", "db_seed.create_example", "--params", "{}"]
    assert validate_argv(argv) == argv


def test_rejects_shell():
    try:
        validate_argv(["bash", "-c", "id"])
    except ValueError:
        return
    raise AssertionError("expected ValueError")


def test_rejects_dump_ddl_path():
    try:
        validate_argv(["python", "apps/dump_ddl.py", "--datasource", "main", "invoice"])
    except ValueError:
        return
    raise AssertionError("expected ValueError")


def test_allows_packages_config_use():
    argv = ["python", "-m", "packages.config", "use", "uat"]
    assert validate_argv(argv) == argv
    assert validate_argv(["python", "-m", "packages.config", "show"]) == ["python", "-m", "packages.config", "show"]
    assert validate_argv(["python", "-m", "packages.config"]) == ["python", "-m", "packages.config"]


def test_rejects_packages_config_injection():
    try:
        validate_argv(["python", "-m", "packages.config", "use", "uat;id"])
    except ValueError:
        return
    raise AssertionError("expected ValueError")


def test_rejects_arbitrary_packages_module():
    try:
        validate_argv(["python", "-m", "packages.db", "run"])
    except ValueError:
        return
    raise AssertionError("expected ValueError")


def test_local_file_allowlist():
    assert validate_local_file_path("config/env_local.py") == "config/env_local.py"
    try:
        validate_local_file_path("config/env.py")
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")
    try:
        validate_local_file_path("../etc/passwd")
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")
    try:
        validate_local_file_content("x" * 300_000)
    except ValueError:
        return
    raise AssertionError("expected ValueError")


if __name__ == "__main__":
    test_allows_index_platform()
    test_allows_packages_action_words()
    test_rejects_shell()
    test_rejects_dump_ddl_path()
    test_allows_packages_config_use()
    test_rejects_packages_config_injection()
    test_rejects_arbitrary_packages_module()
    test_local_file_allowlist()
    print("ok")
