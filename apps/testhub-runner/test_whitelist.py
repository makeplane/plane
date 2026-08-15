from whitelist import validate_argv


def test_allows_index_platform():
    argv = ["python", "-m", "apps.index_platform", "--out", "-"]
    assert validate_argv(argv) == argv


def test_allows_dump_ddl():
    argv = ["python", "apps/dump_ddl.py", "--datasource", "main", "invoice"]
    assert validate_argv(argv) == argv


def test_rejects_shell():
    try:
        validate_argv(["bash", "-c", "id"])
    except ValueError:
        return
    raise AssertionError("expected ValueError")


def test_rejects_dump_ddl_injection():
    try:
        validate_argv(["python", "apps/dump_ddl.py", "--datasource", "main", "invoice;rm"])
    except ValueError:
        return
    raise AssertionError("expected ValueError")


if __name__ == "__main__":
    test_allows_index_platform()
    test_allows_dump_ddl()
    test_rejects_shell()
    test_rejects_dump_ddl_injection()
    print("ok")
