# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Models for the page feature group. See plane/nexus/README.md.

Pages themselves are Plane's own `db.Page` rows: a project page is linked to its
project through `db.ProjectPage` (exactly as the web app creates it), a
workspace ("wiki") page is a `db.Page` with `is_global=True` and no project link.
Estimates are Plane's own `db.Estimate` / `db.EstimatePoint`.

The tables below are what Community Edition lacks: collections (folders of
workspace pages, with members), the row that files a page in a collection, and
the link between a work item and a page.
"""

from django.conf import settings
from django.db import models
from django.db.models import Q

from plane.db.models import BaseModel

__all__ = [
    "Collection",
    "CollectionMember",
    "PageCollection",
    "WorkItemPage",
    "COLLECTION_PUBLIC",
    "COLLECTION_PRIVATE",
    "MEMBER_VIEW",
    "MEMBER_COMMENT",
    "MEMBER_EDIT",
]

COLLECTION_PUBLIC, COLLECTION_PRIVATE = 0, 1
MEMBER_VIEW, MEMBER_COMMENT, MEMBER_EDIT = 0, 1, 2

_ALIVE = Q(deleted_at__isnull=True)


class Collection(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_collections")
    name = models.CharField(max_length=255)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nexus_owned_collections"
    )
    # Fixed at creation: 0 public (every workspace member), 1 private (members only).
    access = models.PositiveSmallIntegerField(
        choices=((COLLECTION_PUBLIC, "Public"), (COLLECTION_PRIVATE, "Private")), default=COLLECTION_PUBLIC
    )
    logo_props = models.JSONField(default=dict, blank=True)
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "nexus_collections"
        ordering = ("sort_order", "created_at")


class CollectionMember(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_collection_members")
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="members")
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nexus_collection_memberships"
    )
    access = models.PositiveSmallIntegerField(
        choices=((MEMBER_VIEW, "View"), (MEMBER_COMMENT, "Comment"), (MEMBER_EDIT, "Edit")), default=MEMBER_VIEW
    )

    class Meta:
        db_table = "nexus_collection_members"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["collection", "member"], condition=_ALIVE, name="nexus_collection_member_unique"
            ),
        ]


class PageCollection(BaseModel):
    """Files one workspace page in one collection (a page is in at most one)."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_page_collections")
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="page_links")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="nexus_collection_links")
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "nexus_page_collections"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(fields=["page"], condition=_ALIVE, name="nexus_page_collection_unique_page"),
        ]


class WorkItemPage(BaseModel):
    """Links a page (project or workspace) to a work item."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_work_item_pages")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="nexus_work_item_pages")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="nexus_page_links")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="nexus_work_item_links")

    class Meta:
        db_table = "nexus_work_item_pages"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["issue", "page"], condition=_ALIVE, name="nexus_work_item_page_unique"),
        ]
