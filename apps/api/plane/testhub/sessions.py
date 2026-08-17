# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from typing import Any


class SessionSelectionError(ValueError):
    """Raised when a session selection payload is not a list of path references."""


def clean_session_selection(selection: Any) -> list[dict[str, str]]:
    """Keep only Formulation path + scenario name. Never persist Gherkin bodies."""
    if not isinstance(selection, list):
        raise SessionSelectionError("selection must be a list.")
    cleaned: list[dict[str, str]] = []
    for item in selection:
        if not isinstance(item, dict):
            raise SessionSelectionError("each selection item must be an object.")
        feature_path = str(item.get("feature_path") or "").strip()
        scenario_name = str(item.get("scenario_name") or "").strip()
        if not feature_path:
            raise SessionSelectionError("feature_path is required.")
        cleaned.append({"feature_path": feature_path, "scenario_name": scenario_name})
    return cleaned
