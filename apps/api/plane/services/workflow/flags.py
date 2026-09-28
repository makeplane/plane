# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow feature-flag helpers — spec §25 Phase 1.

The runtime gate is a tuple:

1. ``settings.ENABLE_WORKFLOWS`` (instance flag, defaults off); and
2. ``project.workflow_enabled`` (per-project toggle, defaults off).

Both gates must be true for the workflow service to enforce a
transition or validate a creation. When either is off the service
behaves as a no-op — see ``TransitionService.transition``.
"""

# Django imports
from django.conf import settings


def instance_workflows_enabled() -> bool:
    """Return the instance-level ``ENABLE_WORKFLOWS`` flag (default ``False``)."""
    return bool(getattr(settings, "ENABLE_WORKFLOWS", False))


def workflows_active(*, project) -> bool:
    """Return ``True`` iff both the instance flag and the project's toggle are on.

    ``project`` may be a ``Project`` instance, ``None``, or a
    duck-typed object exposing ``workflow_enabled``. ``None`` is
    treated as "project gate off" so callers don't need to special-case
    creation before the project row exists.
    """
    if not instance_workflows_enabled():
        return False
    if project is None:
        return False
    return bool(getattr(project, "workflow_enabled", False))
