#!/bin/bash

# Thin wrapper around run_tests.py; run from apps/api so pytest.ini and test paths resolve,
# and through uv so `python` is the project venv (uv run syncs inexactly, safe in the dev/test images)
cd "$(dirname "$0")" || exit 1
exec uv run python run_tests.py "$@"
