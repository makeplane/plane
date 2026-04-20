# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from pathlib import Path
import ast


RUNTIME_ROOT = Path(__file__).resolve().parents[3] / "plane"



def _runtime_python_files():
    for path in RUNTIME_ROOT.rglob("*.py"):
        rel = path.relative_to(RUNTIME_ROOT)
        if rel.parts[0] == "tests":
            continue
        yield path



def test_no_lookup_resource_type_usage_in_runtime_code():
    offenders = []
    for file_path in _runtime_python_files():
        content = file_path.read_text(encoding="utf-8")
        if "lookup_resource_type" in content:
            offenders.append(str(file_path))
    assert not offenders, f"Found legacy lookup_resource_type usage: {offenders}"



def test_permission_engine_check_calls_use_context_kwarg():
    offenders = []
    for file_path in _runtime_python_files():
        content = file_path.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(file_path))
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            if not isinstance(node.func, ast.Attribute):
                continue
            if node.func.attr != "check":
                continue
            if not isinstance(node.func.value, ast.Name) or node.func.value.id != "permission_engine":
                continue

            has_context_kwarg = any(keyword.arg == "context" for keyword in node.keywords)
            if not has_context_kwarg:
                offenders.append(str(file_path))
                break

    assert not offenders, f"permission_engine.check without context kwarg found in: {offenders}"
