# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Scope enforcement for AI service accounts on the public v1 API.

Hooked from ``plane/api/views/base.py`` (BaseAPIView/BaseViewSet
``check_permissions``) — runs AFTER the regular role-based permission classes,
so a bot request must satisfy both: its own membership role AND a matching
``AIScopePolicy`` row AND the owner-subset rule. All failures are 403 and the
default for anything unmapped is deny.
"""

from rest_framework.exceptions import PermissionDenied

from plane.db.models import ProjectMember, WorkspaceMember

from .constants import Action, ResourceType

# v1 API url name -> resource type. Built from plane/api/urls/*.py (plus
# "pages"/"pages-detail" which arrive with the v1 pages endpoints). Router
# basenames expand to -list/-detail suffixes.
URL_RESOURCE_MAP = {
    # member.py
    "project-members": ResourceType.MEMBER,
    "project-member": ResourceType.MEMBER,
    "project-members-lite": ResourceType.MEMBER,
    "workspace-members": ResourceType.MEMBER,
    "workspace-members-lite": ResourceType.MEMBER,
    # user.py
    "users": ResourceType.USER,
    # asset.py
    "user-assets": ResourceType.ASSET,
    "user-assets-detail": ResourceType.ASSET,
    "user-server-assets": ResourceType.ASSET,
    "user-server-assets-detail": ResourceType.ASSET,
    "generic-asset": ResourceType.ASSET,
    "generic-asset-detail": ResourceType.ASSET,
    # estimate.py
    "project-estimate": ResourceType.ESTIMATE,
    "estimate-point-list-create": ResourceType.ESTIMATE,
    "estimate-point-detail": ResourceType.ESTIMATE,
    # cycle.py
    "cycles": ResourceType.CYCLE,
    "cycles-lite": ResourceType.CYCLE,
    "cycle-issues": ResourceType.CYCLE,
    "transfer-issues": ResourceType.CYCLE,
    "cycle-archive-unarchive": ResourceType.CYCLE,
    # module.py
    "modules": ResourceType.MODULE,
    "modules-lite": ResourceType.MODULE,
    "modules-detail": ResourceType.MODULE,
    "module-issues": ResourceType.MODULE,
    "module-issues-detail": ResourceType.MODULE,
    "module-archive": ResourceType.MODULE,
    "module-archive-list": ResourceType.MODULE,
    "module-unarchive": ResourceType.MODULE,
    # sticky.py (router basename "workspace-stickies")
    "workspace-stickies-list": ResourceType.STICKY,
    "workspace-stickies-detail": ResourceType.STICKY,
    # label.py
    "label": ResourceType.LABEL,
    # intake.py
    "intake-issue": ResourceType.INTAKE,
    # invite.py (router basename "workspace-invitations")
    "workspace-invitations-list": ResourceType.INVITE,
    "workspace-invitations-detail": ResourceType.INVITE,
    # state.py
    "states": ResourceType.STATE,
    # project.py
    "project": ResourceType.PROJECT,
    "project-lite": ResourceType.PROJECT,
    "project-archive-unarchive": ResourceType.PROJECT,
    "project-summary": ResourceType.PROJECT,
    # work_item.py — issue/work-item, links, attachments, relations, activity
    "issue-search": ResourceType.WORK_ITEM,
    "issue-by-identifier": ResourceType.WORK_ITEM,
    "issue": ResourceType.WORK_ITEM,
    "link": ResourceType.WORK_ITEM,
    "attachment": ResourceType.WORK_ITEM,
    "issue-attachment": ResourceType.WORK_ITEM,
    "work-item-search": ResourceType.WORK_ITEM,
    "work-item-by-identifier": ResourceType.WORK_ITEM,
    "work-item-list": ResourceType.WORK_ITEM,
    "work-item-detail": ResourceType.WORK_ITEM,
    "work-item-link-list": ResourceType.WORK_ITEM,
    "work-item-link-detail": ResourceType.WORK_ITEM,
    "work-item-attachment-list": ResourceType.WORK_ITEM,
    "work-item-attachment-detail": ResourceType.WORK_ITEM,
    "work-item-activity-list": ResourceType.WORK_ITEM,
    "work-item-activity-detail": ResourceType.WORK_ITEM,
    "work-item-relation-list": ResourceType.WORK_ITEM,
    "activity": ResourceType.WORK_ITEM,
    # work_item.py — comments are a first-class resource type
    "comment": ResourceType.COMMENT,
    "work-item-comment-list": ResourceType.COMMENT,
    "work-item-comment-detail": ResourceType.COMMENT,
    # page.py (v1 pages endpoints)
    "pages": ResourceType.PAGE,
    "pages-detail": ResourceType.PAGE,
}

ACTION_BY_METHOD = {
    "GET": Action.READ,
    "HEAD": Action.READ,
    "OPTIONS": Action.READ,
    "POST": Action.CREATE,
    "PATCH": Action.UPDATE,
    "PUT": Action.UPDATE,
    "DELETE": Action.DELETE,
}


def get_ai_account(request):
    """Lazily resolve and cache the AIAccount for the request's bot user."""
    cached = getattr(request, "_ai_account_cache", None)
    if cached is not None:
        return cached

    from .models import AIAccount

    account = (
        AIAccount.objects.filter(bot_user=request.user, is_active=True)
        .select_related("owner")
        .first()
    )
    request._ai_account_cache = account
    return account


def enforce_ai_scope(request, view):
    """Raise PermissionDenied unless the bot's request is fully in scope."""
    account = get_ai_account(request)
    if account is None:
        raise PermissionDenied("AI account is missing or inactive.")

    # 1. Map the endpoint to (resource_type, action)
    url_name = getattr(request.resolver_match, "url_name", None)
    resource_type = URL_RESOURCE_MAP.get(url_name)
    if resource_type is None:
        raise PermissionDenied(f"Endpoint '{url_name}' is not available to AI accounts.")
    action = ACTION_BY_METHOD.get(request.method)
    if action is None:
        raise PermissionDenied(f"Method {request.method} is not available to AI accounts.")

    # 2. Scope policy: project-specific row wins, else workspace-wide row
    from .models import AIScopePolicy

    project_id = view.project_id
    policies = AIScopePolicy.objects.filter(
        ai_account=account, resource_type=resource_type, action=action
    )
    if project_id:
        allowed = policies.filter(project_id=project_id).exists() or policies.filter(
            project__isnull=True
        ).exists()
    else:
        allowed = policies.filter(project__isnull=True).exists()
    if not allowed:
        raise PermissionDenied(
            f"AI account '{account.name}' is not allowed to {action} {resource_type}."
        )

    # 3. Owner-subset: the owner must still be an active workspace member, and
    # for project resources an active project member whose role covers the bot's
    slug = view.workspace_slug
    if not WorkspaceMember.objects.filter(
        workspace__slug=slug, member=account.owner, is_active=True
    ).exists():
        raise PermissionDenied("AI account owner is not an active workspace member.")

    if project_id:
        bot_membership = ProjectMember.objects.filter(
            project_id=project_id, member=account.bot_user, is_active=True
        ).first()
        owner_membership = ProjectMember.objects.filter(
            project_id=project_id, member=account.owner, is_active=True
        ).first()
        if bot_membership is not None:
            if owner_membership is None:
                raise PermissionDenied("AI account owner is not a member of this project.")
            if owner_membership.role < bot_membership.role:
                raise PermissionDenied(
                    "AI account owner no longer holds the role this account was granted."
                )
