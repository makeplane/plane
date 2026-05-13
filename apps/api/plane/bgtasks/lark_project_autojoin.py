# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import os

# Third party
from celery import shared_task

# Django
from django.db import transaction

# Module imports
from plane.db.models import Project, ProjectMember, WorkspaceMember

logger = logging.getLogger("plane.bgtasks.lark_project_autojoin")


def autojoin_all_workspace_members(project_id):
    """Idempotently add every active workspace member as an active project
    member with the role they hold on the workspace. Per-row .save() preserves
    the ProjectMember.save() override that creates the companion
    ProjectUserProperty row used for sidebar ordering.

    Returns a stats dict. Safe to call repeatedly.
    """
    project = Project.objects.filter(id=project_id).first()
    if project is None:
        return {"error": f"project {project_id} not found"}

    members = list(
        WorkspaceMember.objects.filter(
            workspace_id=project.workspace_id, is_active=True
        ).select_related("member")
    )

    new = reactivated = existing = 0
    for wm in members:
        if wm.member_id is None:
            continue
        try:
            with transaction.atomic():
                pm, created = ProjectMember.objects.get_or_create(
                    project=project,
                    member=wm.member,
                    defaults={
                        "role": wm.role,
                        "workspace_id": project.workspace_id,
                        "is_active": True,
                    },
                )
                if created:
                    new += 1
                elif not pm.is_active:
                    pm.is_active = True
                    pm.role = wm.role
                    pm.save(update_fields=["is_active", "role"])
                    reactivated += 1
                else:
                    existing += 1
        except Exception:
            logger.exception("autojoin failed for project=%s member=%s", project_id, wm.member_id)

    stats = {
        "project_id": str(project.id),
        "project_identifier": project.identifier,
        "workspace_members_seen": len(members),
        "project_members_created": new,
        "project_members_reactivated": reactivated,
        "project_members_already_active": existing,
        "project_member_total": ProjectMember.objects.filter(
            project=project, is_active=True
        ).count(),
    }
    logger.info("Project autojoin complete: %s", stats)
    return stats


@shared_task
def autojoin_workspace_members_to_project_task(project_id):
    """Celery wrapper called by the post_save signal. No-op unless
    LARK_AUTO_JOIN_NEW_PROJECTS is truthy.

    Scoped to LARK_DEFAULT_WORKSPACE_SLUG to avoid auto-populating projects
    in unrelated workspaces on multi-tenant deploys.
    """
    if (os.environ.get("LARK_AUTO_JOIN_NEW_PROJECTS") or "").strip().lower() not in (
        "1",
        "true",
        "yes",
    ):
        return {"skipped": "LARK_AUTO_JOIN_NEW_PROJECTS not enabled"}

    target_slug = (os.environ.get("LARK_DEFAULT_WORKSPACE_SLUG") or "").strip()
    project = Project.objects.filter(id=project_id).select_related("workspace").first()
    if project is None:
        return {"error": f"project {project_id} not found"}
    if target_slug and project.workspace.slug != target_slug:
        return {"skipped": f"workspace {project.workspace.slug} != {target_slug}"}

    return autojoin_all_workspace_members(project_id)
