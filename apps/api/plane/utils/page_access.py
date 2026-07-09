# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import Page, ProjectPage, WorkspaceMember

# Workspace roles allowed to read the wiki (guests are excluded)
WIKI_MIN_ROLE = 15


def can_read_page(user, page):
    """Resolve read access to a page for a given user, row by row.

    A project page is readable when it is public (or owned by the requester)
    and the requester is an active member of at least one non-archived project
    the page belongs to. A workspace (wiki) page — ``is_global`` and no
    ``ProjectPage`` row — is readable when it is public (or owned by the
    requester) and the requester is an active workspace admin or member
    (workspace guests are excluded from the wiki). Access is never granted
    transitively through a link table.
    """
    if page is None:
        return False

    # Visibility: public pages, or private pages owned by the requester
    if page.access != Page.PUBLIC_ACCESS and page.owned_by_id != user.id:
        return False

    project_pages = ProjectPage.objects.filter(page_id=page.id)

    # Workspace (wiki) page: membership is resolved at the workspace level
    if page.is_global and not project_pages.exists():
        return WorkspaceMember.objects.filter(
            workspace_id=page.workspace_id,
            member=user,
            is_active=True,
            role__gte=WIKI_MIN_ROLE,
        ).exists()

    # Membership: the requester must belong to a project the page lives in
    return project_pages.filter(
        project__project_projectmember__member=user,
        project__project_projectmember__is_active=True,
        project__archived_at__isnull=True,
    ).exists()


def readable_issue_pages(queryset, user):
    """Filter an ``IssuePage`` queryset to the rows whose page is readable.

    Mirrors :func:`can_read_page` at the queryset level so ``list`` endpoints
    never leak a private page owned by someone else. Handles both project
    pages (project membership) and workspace pages (workspace admin/member).
    """
    project_readable = Q(
        page__projects__project_projectmember__member=user,
        page__projects__project_projectmember__is_active=True,
        page__projects__archived_at__isnull=True,
    )
    workspace_readable = Q(
        page__is_global=True,
        page__projects__isnull=True,
        page__workspace__workspace_member__member=user,
        page__workspace__workspace_member__is_active=True,
        page__workspace__workspace_member__role__gte=WIKI_MIN_ROLE,
    )
    return (
        queryset.filter(Q(page__owned_by=user) | Q(page__access=Page.PUBLIC_ACCESS))
        .filter(project_readable | workspace_readable)
        .distinct()
    )
