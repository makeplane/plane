"""Reading Plane's governance: who owns a resource, and what the plan allow."""

from __future__ import annotations

import functools
import re
from collections.abc import Callable
from typing import Any, TypeVar

from plane.errors.errors import HttpError

WORKSPACE_MANAGED = "workspace_managed"
# Its inverse: a catalogue endpoint called in a workspace that still owns per project.
WORKSPACE_NOT_MANAGED = "workspace_not_managed"
MIGRATION_IN_PROGRESS = "governance_migration_in_progress"

# The governed resources, named as this server refers to them.
WORK_ITEM_TYPES = "work_item_types"
STATES = "states"
LABELS = "labels"
WORKFLOWS = "workflows"
TEMPLATES = "templates"
AUTOMATIONS = "automations"

GOVERNED_BY = {
    WORK_ITEM_TYPES: "work_item_types",
    STATES: "states_owned_by_workspace",
    LABELS: "states_owned_by_workspace",
    WORKFLOWS: "states_owned_by_workspace",
    TEMPLATES: "states_owned_by_workspace",
    AUTOMATIONS: "states_owned_by_workspace",
}

NOT_MANAGED_PROSE = re.compile(r"workspace work item type.*not enabled", re.IGNORECASE)

# Some validators raise 400 with the plan gate only in prose; matched as a fallback.
PLAN_GATE_PROSE = "upgrade your plan"

# The gate names what it wants enabled, which beats a caller's guess at which one fired.
_PLAN_GATE_FEATURE = re.compile(r"upgrade your plan to enable (?P<feature>[^.\"']+)", re.IGNORECASE)

F = TypeVar("F", bound=Callable[..., Any])


def _body(exc: HttpError) -> dict[str, Any]:
    """The 400's body, or empty for anything else."""
    return exc.response if exc.status_code == 400 and isinstance(exc.response, dict) else {}


def workspace_owns(exc: HttpError, *fields: str) -> bool:
    """Whether a refusal means the workspace catalogue owns this resource."""
    body = _body(exc)
    return body.get("code") == WORKSPACE_MANAGED or any(field in body for field in fields)


def workspace_owns_resource(client: Any, workspace_slug: str, resource: str) -> bool:
    """Whether the workspace catalogue owns `resource`, per the flag that governs it."""
    flag = GOVERNED_BY[resource]
    features = client.workspaces.get_features(workspace_slug=workspace_slug)
    return bool(features.model_dump().get(flag))


def project_owns(exc: HttpError) -> bool:
    """Whether a refusal means this resource still lives per project."""
    body = _body(exc)
    if body.get("code") == WORKSPACE_NOT_MANAGED:
        return True
    return bool(NOT_MANAGED_PROSE.search(str(body.get("error", ""))))


def wrong_scope(exc: HttpError, resource: str, *fields: str, project_id: str = "") -> str | None:
    """The message telling a caller which scope owns `resource`, or None."""
    if workspace_owns(exc, *fields):
        return f"Error: this workspace owns its {resource}. Omit project_id to work with the catalogue."
    if not project_id and project_owns(exc):
        return f"Error: this workspace keeps {resource} per project. Pass project_id."
    return None


def scoped(resource: str, *fields: str) -> Callable[[F], F]:
    """Turn a wrong-scope refusal anywhere in a resource's dispatch into that message."""

    def decorate(fn: F) -> F:
        @functools.wraps(fn)
        def guarded(*args: Any, **kwargs: Any) -> Any:
            try:
                return fn(*args, **kwargs)
            except HttpError as exc:
                if message := wrong_scope(exc, resource, *fields, project_id=kwargs.get("project_id", "")):
                    return message
                raise

        return guarded  # type: ignore[return-value]

    return decorate


def migration_in_progress(exc: HttpError) -> bool:
    """Whether a refusal means a governance migration is running, so the write may be retried."""
    return _body(exc).get("code") == MIGRATION_IN_PROGRESS


def plan_required(exc: HttpError, feature: str) -> str | None:
    """A message naming the gated feature when the plan does not include it, else None."""
    if exc.status_code == 402 or (exc.status_code == 400 and PLAN_GATE_PROSE in str(exc).lower()):
        named = _gated_feature(exc) or feature
        return f"Error: {named} is not available on this workspace's plan, so this cannot be done here."
    return None


def _gated_feature(exc: HttpError) -> str | None:
    """The feature the refusal named, so the answer matches the gate that actually fired."""
    match = _PLAN_GATE_FEATURE.search(str(exc.response) if exc.response else str(exc))
    return match.group("feature").strip() if match else None


def plan_gated(feature: str) -> Callable[[F], F]:
    """Turn a plan refusal anywhere in a resource's dispatch into a legible answer."""

    def decorate(fn: F) -> F:
        @functools.wraps(fn)
        def guarded(*args: Any, **kwargs: Any) -> Any:
            try:
                return fn(*args, **kwargs)
            except HttpError as exc:
                if message := plan_required(exc, feature):
                    return message
                raise

        return guarded  # type: ignore[return-value]

    return decorate
