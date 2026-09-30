# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from typing import Any

from plane.db.models import (
    Cycle,
    IssueType,
    Label,
    Module,
    Project,
    ProjectIssueType,
    State,
    WorkspaceMember,
)


PAYLOAD_KEYS_ALLOWED_GLOBAL = frozenset(
    {
        "name",
        "description_html",
        "type_id",
        "priority",
        "assignee_ids",
        "estimate_point",
        "start_date",
        "target_date",
    }
)

PAYLOAD_KEYS_PROJECT_SCOPED = frozenset({"state_id", "label_ids", "cycle_id", "module_ids"})


def _parse_uuid(value: Any) -> uuid.UUID | None:
    if value is None or value == "":
        return None
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


def sanitize_payload_for_scope(*, project: Project | None, raw: dict) -> dict:
    """
    When template has no project, drop project-scoped keys from stored payload.
    """
    if project is not None:
        return dict(raw) if isinstance(raw, dict) else {}
    out = {}
    if not isinstance(raw, dict):
        return out
    for k, v in raw.items():
        if k in PAYLOAD_KEYS_ALLOWED_GLOBAL:
            out[k] = v
    return out


def resolve_payload_for_project(*, workspace_id, project_id: uuid.UUID, raw: dict) -> dict:
    """
    Returns a dict safe to merge into issue create form for the given project.
    Invalid references are omitted.
    """
    if not isinstance(raw, dict):
        return {}

    project = Project.objects.filter(id=project_id, workspace_id=workspace_id).first()
    if not project:
        return {}

    resolved: dict = {}

    if "name" in raw and raw["name"] is not None:
        resolved["name"] = str(raw["name"])[:500]

    if "description_html" in raw and raw["description_html"] is not None:
        resolved["description_html"] = str(raw["description_html"])

    priority = raw.get("priority")
    if priority in ("urgent", "high", "medium", "low", "none", None):
        resolved["priority"] = priority

    t_id = _parse_uuid(raw.get("type_id"))
    if t_id and ProjectIssueType.objects.filter(
        project_id=project_id, issue_type_id=t_id, deleted_at__isnull=True
    ).exists():
        resolved["type_id"] = str(t_id)

    s_id = _parse_uuid(raw.get("state_id"))
    if s_id and State.objects.filter(id=s_id, project_id=project_id, deleted_at__isnull=True).exists():
        resolved["state_id"] = str(s_id)

    est = raw.get("estimate_point")
    if est is not None and est != "":
        resolved["estimate_point"] = str(est)

    for date_key in ("start_date", "target_date"):
        if date_key in raw and raw[date_key] not in (None, ""):
            resolved[date_key] = str(raw[date_key])[:10]

    label_ids = raw.get("label_ids")
    if isinstance(label_ids, list) and label_ids:
        good = [
            str(lid)
            for lid in label_ids
            if Label.objects.filter(
                id=_parse_uuid(lid),
                project_id=project_id,
                deleted_at__isnull=True,
            ).exists()
        ]
        if good:
            resolved["label_ids"] = good
        else:
            resolved["label_ids"] = []

    assignee_ids = raw.get("assignee_ids")
    if isinstance(assignee_ids, list) and assignee_ids:
        member_ids: list[str] = []
        for uid in assignee_ids:
            u = _parse_uuid(uid)
            if u and WorkspaceMember.objects.filter(
                workspace_id=workspace_id,
                member_id=u,
                is_active=True,
            ).exists():
                member_ids.append(str(u))
        if member_ids:
            resolved["assignee_ids"] = member_ids
        else:
            resolved["assignee_ids"] = []

    c_id = _parse_uuid(raw.get("cycle_id"))
    if c_id and Cycle.objects.filter(
        id=c_id, project_id=project_id, deleted_at__isnull=True, archived_at__isnull=True
    ).exists():
        resolved["cycle_id"] = str(c_id)

    mod_ids = raw.get("module_ids")
    if isinstance(mod_ids, list) and mod_ids:
        good_m = [
            str(mid)
            for mid in mod_ids
            if Module.objects.filter(
                id=_parse_uuid(mid), project_id=project_id, deleted_at__isnull=True, archived_at__isnull=True
            ).exists()
        ]
        if good_m:
            resolved["module_ids"] = good_m
        else:
            resolved["module_ids"] = []

    return resolved


def validate_payload(
    *, workspace_id, project: Project | None, data: dict, strict_project: bool
) -> dict:
    """
    Validates and normalizes payload on create/update. Raises ValueError on invalid data.
    """
    if not isinstance(data, dict):
        raise ValueError("payload must be a JSON object")

    unknown = set(data.keys()) - (PAYLOAD_KEYS_ALLOWED_GLOBAL | PAYLOAD_KEYS_PROJECT_SCOPED)
    if unknown:
        raise ValueError(f"Unknown payload keys: {', '.join(sorted(unknown))}")

    for k in PAYLOAD_KEYS_PROJECT_SCOPED:
        if not strict_project and k in data and data[k] not in (None, [], ""):
            raise ValueError(
                f"Field '{k}' is only allowed when the template is scoped to a project. "
                "Omit it or set a project for this template."
            )

    if "type_id" in data and data["type_id"] is not None:
        tid = _parse_uuid(data["type_id"])
        if not tid or not IssueType.objects.filter(
            id=tid, workspace_id=workspace_id, is_active=True
        ).exists():
            raise ValueError("Invalid work item type (type_id)")
        if project and not ProjectIssueType.objects.filter(
            project=project, issue_type_id=tid, deleted_at__isnull=True
        ).exists():
            raise ValueError("Work item type is not enabled for this project")

    if strict_project and project is not None:
        s_id = _parse_uuid(data.get("state_id"))
        if s_id and not State.objects.filter(id=s_id, project_id=project.id, deleted_at__isnull=True).exists():
            raise ValueError("Invalid state for this project")

        c_id = _parse_uuid(data.get("cycle_id"))
        if c_id and not Cycle.objects.filter(
            id=c_id, project_id=project.id, deleted_at__isnull=True, archived_at__isnull=True
        ).exists():
            raise ValueError("Invalid cycle for this project")

        label_ids = data.get("label_ids")
        if isinstance(label_ids, list):
            for lid in label_ids:
                lu = _parse_uuid(lid)
                if lu and not Label.objects.filter(
                    id=lu, project_id=project.id, deleted_at__isnull=True
                ).exists():
                    raise ValueError("Invalid label id in label_ids")

        mod_ids = data.get("module_ids")
        if isinstance(mod_ids, list):
            for mid in mod_ids:
                mu = _parse_uuid(mid)
                if mu and not Module.objects.filter(
                    id=mu, project_id=project.id, deleted_at__isnull=True, archived_at__isnull=True
                ).exists():
                    raise ValueError("Invalid module id in module_ids")

        assignee_ids = data.get("assignee_ids")
        if isinstance(assignee_ids, list):
            for aid in assignee_ids:
                au = _parse_uuid(aid)
                if au and not WorkspaceMember.objects.filter(
                    workspace_id=workspace_id, member_id=au, is_active=True
                ).exists():
                    raise ValueError("Invalid assignee (not a workspace member)")

    return data
