# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Applying PROJECT.md's workflow to a real workspace.

Shared by the ``bootstrap_engineering_ops`` management command and the
bootstrap endpoint, because an operator setting up a new instance and a PM
clicking a button in settings must not produce two different workspaces.

Everything here is additive and idempotent. Nothing is deleted: a state a
project is already using cannot be removed without orphaning issues, and a
setup routine that can destroy work is a setup routine nobody dares run twice.
"""

# Python imports
import logging

# Django imports
from django.db import transaction

# Module imports
from workspaces.db.models import (
    Issue,
    IssueType,
    Label,
    Project,
    ProjectIssueType,
    State,
)
from workspaces.utils.engineering_ops import (
    ENGINEERING_ISSUE_TYPES,
    ENGINEERING_LABELS,
    ENGINEERING_WORKFLOW_STATES,
)

logger = logging.getLogger("workspaces.worker")

# Workspaces ships a project with "Done" as its completed state; PROJECT.md calls
# that step "Deployed". Renaming is only safe while nothing is sitting in it --
# past that point the name is part of somebody's history.
RENAMEABLE = {"done": "Deployed"}


def apply_states(project, created_by_id=None):
    """Create the workflow's states in one project. Returns what changed."""
    existing = {state.name.casefold(): state for state in State.all_state_objects.filter(project=project)}
    created, renamed = [], []

    for target_name, source_name in ((v, k) for k, v in RENAMEABLE.items()):
        source = existing.get(source_name)
        if source and target_name.casefold() not in existing and not Issue.objects.filter(state=source).exists():
            source.name = target_name
            source.save()
            existing.pop(source_name)
            existing[target_name.casefold()] = source
            renamed.append({"from": source_name.title(), "to": target_name})

    for spec in ENGINEERING_WORKFLOW_STATES:
        if spec["name"].casefold() in existing:
            continue
        state = State.objects.create(
            project=project,
            workspace_id=project.workspace_id,
            name=spec["name"],
            color=spec["color"],
            group=spec["group"],
            sequence=spec["sequence"],
            # `default` is where new issues land, and a project already has
            # one. Claiming it a second time would move every future issue.
            default=spec.get("default", False) and not State.objects.filter(project=project, default=True).exists(),
            created_by_id=created_by_id,
        )
        existing[state.name.casefold()] = state
        created.append(state.name)

    return {"created": created, "renamed": renamed}


def apply_labels(project, created_by_id=None):
    """Create the label vocabulary in one project."""
    existing = {label.name.casefold() for label in Label.objects.filter(project=project)}
    created = []
    for spec in ENGINEERING_LABELS:
        if spec["name"].casefold() in existing:
            continue
        Label.objects.create(
            project=project,
            workspace_id=project.workspace_id,
            name=spec["name"],
            color=spec["color"],
            created_by_id=created_by_id,
        )
        created.append(spec["name"])
    return {"created": created}


def apply_issue_types(workspace, projects, created_by_id=None):
    """
    Create the workspace's issue types and enable them on the given projects.

    Issue types are workspace-level in Workspaces and enabled per project through
    ``ProjectIssueType``, so this is two steps and the second is per project.
    """
    existing = {issue_type.name.casefold(): issue_type for issue_type in IssueType.objects.filter(workspace=workspace)}
    created = []

    for index, spec in enumerate(ENGINEERING_ISSUE_TYPES):
        issue_type = existing.get(spec["name"].casefold())
        if issue_type is None:
            issue_type = IssueType.objects.create(
                workspace=workspace,
                name=spec["name"],
                logo_props={"in_use": "icon", "icon": {"name": spec["icon"], "background_color": spec["color"]}},
                level=index,
                # Whatever a project already treats as default stays default.
                is_default=False,
                created_by_id=created_by_id,
            )
            existing[spec["name"].casefold()] = issue_type
            created.append(spec["name"])

    enabled = 0
    for project in projects:
        has_default = ProjectIssueType.objects.filter(project=project, is_default=True).exists()
        for index, spec in enumerate(ENGINEERING_ISSUE_TYPES):
            issue_type = existing[spec["name"].casefold()]
            if ProjectIssueType.objects.filter(project=project, issue_type=issue_type).exists():
                continue
            ProjectIssueType.objects.create(
                project=project,
                workspace_id=project.workspace_id,
                issue_type=issue_type,
                level=index,
                is_default=(spec["name"] == "Task" and not has_default),
                created_by_id=created_by_id,
            )
            if spec["name"] == "Task" and not has_default:
                has_default = True
            enabled += 1

    return {"created": created, "enabled": enabled}


def bootstrap_workspace(workspace, project_ids=None, created_by_id=None, include_issue_types=True):
    """
    Apply the whole vocabulary to a workspace.

    ``project_ids`` narrows it to specific projects; omitted, every unarchived
    project in the workspace is set up.
    """
    projects = Project.objects.filter(workspace=workspace, archived_at__isnull=True)
    if project_ids:
        projects = projects.filter(id__in=project_ids)
    projects = list(projects)

    result = {"workspace": workspace.slug, "projects": []}

    with transaction.atomic():
        for project in projects:
            result["projects"].append(
                {
                    "id": str(project.id),
                    "name": project.name,
                    "states": apply_states(project, created_by_id),
                    "labels": apply_labels(project, created_by_id),
                }
            )
        if include_issue_types:
            result["issue_types"] = apply_issue_types(workspace, projects, created_by_id)

    logger.info("Engineering operations bootstrap applied to %s (%s projects)", workspace.slug, len(projects))
    return result
