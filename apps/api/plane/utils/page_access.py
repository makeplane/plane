# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import Page, ProjectPage


def can_read_page(user, page):
    """Resolve read access to a page for a given user, row by row.

    A page is readable when it is public (or owned by the requester) and the
    requester is an active member of at least one non-archived project the page
    belongs to. Access is never granted transitively through a link table.
    """
    if page is None:
        return False

    # Visibility: public pages, or private pages owned by the requester
    if page.access != Page.PUBLIC_ACCESS and page.owned_by_id != user.id:
        return False

    # Membership: the requester must belong to a project the page lives in
    return ProjectPage.objects.filter(
        page_id=page.id,
        project__project_projectmember__member=user,
        project__project_projectmember__is_active=True,
        project__archived_at__isnull=True,
    ).exists()


def readable_issue_pages(queryset, user):
    """Filter an ``IssuePage`` queryset to the rows whose page is readable.

    Mirrors :func:`can_read_page` at the queryset level so ``list`` endpoints
    never leak a private page owned by someone else.
    """
    return (
        queryset.filter(Q(page__owned_by=user) | Q(page__access=Page.PUBLIC_ACCESS))
        .filter(
            page__projects__project_projectmember__member=user,
            page__projects__project_projectmember__is_active=True,
            page__projects__archived_at__isnull=True,
        )
        .distinct()
    )
