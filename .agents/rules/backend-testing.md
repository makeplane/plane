## <!-- Scope: apps/api/** -->

## description: Backend test runner commands and markers

# Backend Testing

Test runner: `cd apps/api && python run_tests.py`

## Markers

| Flag   | Marker   | Usage           |
| ------ | -------- | --------------- |
| `-u`   | unit     | Unit tests only |
| `-c`   | contract | Contract tests  |
| `-s`   | smoke    | Smoke tests     |
| (none) | all      | Run all tests   |

## Options

| Flag | Purpose                                        |
| ---- | ---------------------------------------------- |
| `-p` | Parallel execution                             |
| `-o` | Coverage report (`--cov=plane`, threshold 90%) |
| `-v` | Verbose output                                 |

## Defaults

- `--reuse-db --nomigrations` always applied (fast re-runs)
- New test files: place in same app directory, use `@pytest.mark.unit` decorator

WRONG -- Running `pytest` directly (misses custom config)
CORRECT -- `cd apps/api && python run_tests.py -u` for unit tests
