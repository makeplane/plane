# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Products of all teams for the management team."""

# Python imports
from datetime import timedelta

# Django imports
from django.db.models import Q
from django.utils import timezone

# Module imports
from plane.db.models import Issue, ProjectMember, TeamKind
from plane.utils.meetings import list_meetings
from plane.utils.product_progress import product_rows
from plane.utils.products import CLOSED_GROUPS, MEMBER_ROLE, PRODUCT

# Finished products leave the board after this time.
CLOSED_DAYS = 90

# What a reader without access to a closed project may know about its product. The team is needed
# to place the product on the board; the rest of the structure stays hidden.
CLOSED_FIELDS = (
    "id",
    "name",
    "team_id",
    "product_type_id",
    "start_date",
    "target_date",
    "state_id",
    "state_name",
    "state_group",
    "progress",
    "indicator",
)


def board_products(slug, include_closed=False, include_old=True):
    """Products on the board: active projects in active portfolios of active regular teams."""
    products = Issue.issue_objects.filter(
        workspace__slug=slug,
        type__kind=PRODUCT,
        product_detail__deleted_at__isnull=True,
        project__deleted_at__isnull=True,
        project__portfolio__deleted_at__isnull=True,
        project__portfolio__archived_at__isnull=True,
        project__portfolio__team__deleted_at__isnull=True,
        project__portfolio__team__archived_at__isnull=True,
        project__portfolio__team__kind=TeamKind.REGULAR,
    )
    if not include_closed:
        products = products.exclude(project__network=0)
    if not include_old:
        products = products.exclude(
            state__group__in=CLOSED_GROUPS,
            product_detail__closed_at__lt=timezone.now() - timedelta(days=CLOSED_DAYS),
        )
    return products


class BoardReader:
    """What one reader may see and change. Loads their project roles once for all the rows."""

    def __init__(self, user, slug, is_admin):
        self.is_admin = is_admin
        self.roles = dict(
            ProjectMember.objects.filter(workspace__slug=slug, member=user, is_active=True).values_list(
                "project_id", "role"
            )
        )

    def has_project(self, project_id):
        return self.is_admin or self.roles.get(project_id, 0) >= MEMBER_ROLE

    def can_edit(self, project_id, is_closed):
        # Open products are edited by everyone on the board.
        return not is_closed or self.has_project(project_id)

    def rows(self, products):
        return [self._item(row, item) for row, item in self._load(products)]

    def _load(self, products):
        return product_rows(
            products,
            "project__name",
            "project__network",
            "project__portfolio__team_id",
            "product_detail__status_comment_by_id",
            "product_detail__status_comment_at",
        )

    def _item(self, row, item):
        is_closed = row["project__network"] == 0
        item = {
            **item,
            "team_id": row["project__portfolio__team_id"],
            "project_name": row["project__name"],
            "status_comment_by": row["product_detail__status_comment_by_id"],
            "status_comment_at": row["product_detail__status_comment_at"],
        }
        is_limited = is_closed and not self.has_project(row["project_id"])
        if is_limited:
            item = {key: value if key in CLOSED_FIELDS else None for key, value in item.items()}
        return {
            **item,
            "is_closed": is_closed,
            "is_limited": is_limited,
            "can_edit": self.can_edit(row["project_id"], is_closed),
            # Without a membership the project itself does not open.
            "can_open": row["project_id"] in self.roles,
        }


def product_contents(issue, user):
    """Description, tasks and meetings for the panel."""
    tasks = (
        counted_tasks_with_cancelled()
        .filter(parent=issue, archived_at__isnull=True)
        .order_by("sequence_id")
        .values("id", "name", "sequence_id", "state__name", "state__group", "target_date")
    )
    return {
        "description_html": issue.description_html,
        "tasks": [
            {
                "id": row["id"],
                "name": row["name"],
                "sequence_id": row["sequence_id"],
                "state_name": row["state__name"],
                "state_group": row["state__group"],
                "target_date": row["target_date"],
            }
            for row in tasks
        ],
        "meetings": list_meetings(issue.project_id, Q(parent=issue), user, restricted_guest=False),
    }


def counted_tasks_with_cancelled():
    return Issue.objects.filter(is_draft=False).filter(Q(type__isnull=True) | Q(type__kind__isnull=True)).exclude(
        state__group="triage"
    )
