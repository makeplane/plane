# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Typed failure outcomes for Timeline Dependency Schedule Propagation.

Stable wire contract (US-22, US-37, API-06, CONTEXT.md D-05):
  PropagationErrorCode is the canonical 7-value StrEnum that downstream
  consumers (Phase 3 DRF view → frontend) read to map onto user-facing
  messages. Reordering or renaming members requires an explicit ADR
  amendment.

Module scope (PROP-18): move-only.
"""

# Python imports
from dataclasses import dataclass
from enum import StrEnum  # Python 3.12 stdlib — see CONTEXT.md D-05
from uuid import UUID


class PropagationErrorCode(StrEnum):
    """Canonical wire codes for `PropagationResult.failure` (D-05)."""

    DEPENDENCY_CYCLE = "DEPENDENCY_CYCLE"
    PROJECT_BOUNDARY_EXCEEDED = "PROJECT_BOUNDARY_EXCEEDED"
    INCOMPLETE_SCHEDULE = "INCOMPLETE_SCHEDULE"
    PROPAGATION_LIMIT_EXCEEDED = "PROPAGATION_LIMIT_EXCEEDED"
    SCHEDULE_CHANGED = "SCHEDULE_CHANGED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    INVALID_DATE_RANGE = "INVALID_DATE_RANGE"


@dataclass(frozen=True, slots=True)
class PropagationFailure:
    """Diagnostic payload for a failed propagation (CONTEXT.md D-05).

    `work_item_id` carries the offending node when meaningful
    (`INCOMPLETE_SCHEDULE`, `INVALID_DATE_RANGE`, `SCHEDULE_CHANGED`).
    `cycle` carries the closed path from `LoadResult.cycle` for
    `DEPENDENCY_CYCLE`. `message` is human-readable diagnostic English;
    i18n happens in Phase 5's UI.
    """

    code: PropagationErrorCode
    message: str
    work_item_id: UUID | None = None
    cycle: tuple[UUID, ...] | None = None
