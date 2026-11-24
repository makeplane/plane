# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the deprecated GPT_ENGINE configuration contract."""

from pathlib import Path
from runpy import run_path

import pytest


@pytest.mark.unit
@pytest.mark.parametrize(
    "engine, expected",
    [
        pytest.param(None, None, id="unset"),
        pytest.param("", "", id="empty"),
        pytest.param("legacy-model", "legacy-model", id="explicit"),
    ],
)
def test_gpt_engine_requires_explicit_configuration(monkeypatch, engine, expected):
    if engine is None:
        monkeypatch.delenv("GPT_ENGINE", raising=False)
    else:
        monkeypatch.setenv("GPT_ENGINE", engine)
    monkeypatch.setenv("LLM_MODEL", "current-model")

    # Evaluate import-time configuration without mutating the shared module.
    config_path = Path(__file__).resolve().parents[3] / "utils" / "instance_config_variables" / "core.py"
    namespace = run_path(str(config_path))
    values = {item["key"]: item["value"] for item in namespace["core_config_variables"]}

    assert values["GPT_ENGINE"] == expected
    assert values["LLM_MODEL"] == "current-model"
