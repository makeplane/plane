# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction
from django.db.models import Q

from plane.db.models import Issue, Page, WorkItemPage


def visible_page_queryset(slug, project_id, user):
    return (
        Page.objects.filter(workspace__slug=slug, deleted_at__isnull=True)
        .filter(
            Q(is_global=True)
            | Q(
                project_pages__project_id=project_id,
                project_pages__deleted_at__isnull=True,
            )
        )
        .filter(Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS))
        .distinct()
    )


def work_item_page_queryset(slug, project_id, issue_id, user):
    return (
        WorkItemPage.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            issue__project_id=project_id,
            page__deleted_at__isnull=True,
        )
        .filter(page__in=visible_page_queryset(slug, project_id, user))
        .select_related("page", "issue", "project", "workspace", "created_by", "updated_by")
        .distinct()
    )


def attach_page_to_work_item(slug, project_id, issue_id, page_id, user):
    """Attach a visible Page to a Work Item, restoring a soft-deleted link when present."""
    issue = Issue.objects.filter(
        pk=issue_id,
        project_id=project_id,
        workspace__slug=slug,
        deleted_at__isnull=True,
    ).first()
    if issue is None:
        return None, "issue"

    page = visible_page_queryset(slug, project_id, user).filter(pk=page_id).first()
    if page is None:
        return None, "page"

    with transaction.atomic():
        link = WorkItemPage.all_objects.filter(
            project_id=project_id,
            issue_id=issue_id,
            page_id=page.id,
        ).first()
        if link is not None:
            if link.deleted_at is not None:
                link.deleted_at = None
                link.updated_by_id = user.id
                link.save(update_fields=["deleted_at", "updated_by"])
            return link, False

        link = WorkItemPage.objects.create(
            project=issue.project,
            issue=issue,
            page=page,
            created_by_id=user.id,
        )

    return link, True
