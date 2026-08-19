from whitelist import validate_argv


def test_allows_index_platform():
    argv = ["python", "-m", "apps.index_platform", "--out", "-"]
    assert validate_argv(argv) == argv


def test_allows_action_runner():
    argv = [
        "python",
        "-m",
        "apps.action_runner",
        "run",
        "--expect-category",
        "db_seed",
        "db_seed.create_example",
        "--params",
        "{}",
    ]
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


def test_rejects_packages_action_words():
    try:
        validate_argv(["python", "-m", "packages.action_words", "run", "db_seed.x"])
    except ValueError:
        return
    raise AssertionError("expected ValueError")


if __name__ == "__main__":
    test_allows_index_platform()
    test_allows_action_runner()
    test_rejects_shell()
    test_rejects_dump_ddl_path()
    test_rejects_packages_action_words()
    print("ok")
