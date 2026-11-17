# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Password strength is scored only through plane.authentication.utils.password."""

import re
from pathlib import Path

import pytest

import plane

PLANE_ROOT = Path(plane.__file__).resolve().parent
ZXCVBN_IMPORT = re.compile(r"^\s*(?:from|import)\s+zxcvbn\b", re.MULTILINE)


@pytest.mark.unit
def test_only_password_util_imports_zxcvbn():
    importers = {
        path.relative_to(PLANE_ROOT).as_posix()
        for path in PLANE_ROOT.rglob("*.py")
        if path.relative_to(PLANE_ROOT).parts[0] != "tests" and ZXCVBN_IMPORT.search(path.read_text(encoding="utf-8"))
    }

    assert importers == {"authentication/utils/password.py"}
