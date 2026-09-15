# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Research rule engines.

Business rules live here, not in the views: the stage gate, the stage state
machine and (from P1-A2 on) the review rules. Every entry point is pure enough
to be unit tested without HTTP.
"""

from .stage_gate import evaluate_stage_gate, resolve_requirements
from .stage_service import StageRuleError

__all__ = ["evaluate_stage_gate", "resolve_requirements", "StageRuleError"]
