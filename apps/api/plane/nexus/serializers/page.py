# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Request validation and response shapes for pages, collections, work item page
links and estimates (plane-sdk `models.pages`, `models.collections`,
`models.work_item_pages`, `models.estimates`)."""

from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import OuterRef, Subquery, UUIDField, Value
from django.db.models.functions import Coalesce
from rest_framework import serializers

from plane.api.serializers import EstimateSerializer
from plane.db.models import Page, ProjectPage
from plane.nexus.models.page import (
    COLLECTION_PRIVATE,
    COLLECTION_PUBLIC,
    MEMBER_COMMENT,
    MEMBER_EDIT,
    MEMBER_VIEW,
    PageCollection,
)

PAGE_ACCESS = (Page.PUBLIC_ACCESS, Page.PRIVATE_ACCESS)
COLLECTION_ACCESS = (COLLECTION_PUBLIC, COLLECTION_PRIVATE)
MEMBER_ACCESS = (MEMBER_VIEW, MEMBER_COMMENT, MEMBER_EDIT)
ESTIMATE_TYPES = ("categories", "points", "time")


# ── Pages ────────────────────────────────────────────────────────────────────


def annotate_pages(queryset):
    """Adds what the Page response needs without a query per row."""
    link = PageCollection.objects.filter(page_id=OuterRef("pk"), deleted_at__isnull=True)
    projects = (
        ProjectPage.objects.filter(page_id=OuterRef("pk"), deleted_at__isnull=True)
        .order_by()
        .values("page_id")
        .annotate(ids=ArrayAgg("project_id", distinct=True))
        .values("ids")
    )
    return queryset.annotate(
        nexus_project_ids=Coalesce(
            Subquery(projects, output_field=ArrayField(UUIDField())),
            Value([], output_field=ArrayField(UUIDField())),
        ),
        nexus_collection_id=Subquery(link.values("collection_id")[:1]),
        nexus_page_collection_id=Subquery(link.values("id")[:1]),
    )


def page_data(page) -> dict:
    """plane-sdk `Page`. `page` should come from `annotate_pages`."""
    project_ids = getattr(page, "nexus_project_ids", None)
    if project_ids is None:
        project_ids = list(page.project_pages.filter(deleted_at__isnull=True).values_list("project_id", flat=True))
    return {
        "id": str(page.id),
        "name": page.name,
        "description_html": page.description_html,
        "description_stripped": page.description_stripped,
        # The Yjs document is the live server's business; it is never sent here.
        "description_binary": None,
        "description": page.description_json,
        "owned_by": str(page.owned_by_id),
        "anchor": None,
        "workspace": str(page.workspace_id),
        "projects": [str(pid) for pid in project_ids],
        "access": page.access,
        "color": page.color,
        "is_locked": page.is_locked,
        "is_global": page.is_global,
        "archived_at": page.archived_at.isoformat() if page.archived_at else None,
        "parent_id": str(page.parent_id) if page.parent_id else None,
        "parent": str(page.parent_id) if page.parent_id else None,
        "collection_id": _str(getattr(page, "nexus_collection_id", None)),
        "page_collection_id": _str(getattr(page, "nexus_page_collection_id", None)),
        "logo_props": page.logo_props,
        "view_props": page.view_props,
        "sort_order": page.sort_order,
        "external_id": page.external_id,
        "external_source": page.external_source,
        "created_at": page.created_at,
        "updated_at": page.updated_at,
        "created_by": _str(page.created_by_id),
        "updated_by": _str(page.updated_by_id),
    }


def _str(value):
    return str(value) if value is not None else None


class _PageFields(serializers.Serializer):
    access = serializers.ChoiceField(choices=PAGE_ACCESS, required=False)
    color = serializers.CharField(required=False, allow_blank=True, max_length=255)
    is_locked = serializers.BooleanField(required=False)
    view_props = serializers.JSONField(required=False)
    logo_props = serializers.JSONField(required=False)
    external_id = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=255)
    external_source = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=255)


class PageCreateSerializer(_PageFields):
    """plane-sdk `CreatePage`."""

    name = serializers.CharField(allow_blank=True)
    description_html = serializers.CharField(allow_blank=True, trim_whitespace=False)
    parent_id = serializers.UUIDField(required=False, allow_null=True)
    collection_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        if attrs.get("parent_id") and attrs.get("collection_id"):
            raise serializers.ValidationError("Pass parent_id or collection_id, not both.")
        return attrs


class PageUpdateSerializer(_PageFields):
    """plane-sdk `UpdatePage`. Archiving goes through the archive endpoint."""

    name = serializers.CharField(required=False, allow_blank=True)
    description_html = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)


# ── Collections ──────────────────────────────────────────────────────────────


def collection_data(collection, current_user_access, has_pages) -> dict:
    """plane-sdk `Collection`."""
    return {
        "id": str(collection.id),
        "name": collection.name,
        "owned_by_id": str(collection.owned_by_id),
        "access": collection.access,
        "current_user_access": current_user_access,
        "has_pages": has_pages,
        "is_default": False,
        "is_global": True,
        "logo_props": collection.logo_props,
        "sort_order": collection.sort_order,
        "workspace": str(collection.workspace_id),
        "created_at": collection.created_at,
        "updated_at": collection.updated_at,
        "created_by": _str(collection.created_by_id),
        "updated_by": _str(collection.updated_by_id),
    }


class CollectionCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    access = serializers.ChoiceField(choices=COLLECTION_ACCESS, required=False)
    logo_props = serializers.JSONField(required=False)


class CollectionUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    logo_props = serializers.JSONField(required=False)
    sort_order = serializers.FloatField(required=False)


def collection_member_data(row) -> dict:
    """plane-sdk `CollectionMember`."""
    return {
        "id": str(row.id),
        "collection": str(row.collection_id),
        "member": str(row.member_id),
        "access": row.access,
        "workspace": str(row.workspace_id),
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "created_by": _str(row.created_by_id),
        "updated_by": _str(row.updated_by_id),
    }


class CollectionMemberCreateSerializer(serializers.Serializer):
    member = serializers.UUIDField()
    access = serializers.ChoiceField(choices=MEMBER_ACCESS)


class CollectionMemberUpdateSerializer(serializers.Serializer):
    access = serializers.ChoiceField(choices=MEMBER_ACCESS)


def collection_page_data(row) -> dict:
    """plane-sdk `CollectionPage` (the flat membership row)."""
    return {
        "id": str(row.id),
        "collection": str(row.collection_id),
        "page": str(row.page_id),
        "workspace": str(row.workspace_id),
        "sort_order": row.sort_order,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "created_by": _str(row.created_by_id),
        "updated_by": _str(row.updated_by_id),
    }


def collection_branch_page_data(row) -> dict:
    """plane-sdk `CollectionBranchPage`: a membership with its page nested.
    `row.page` should come from `annotate_pages`."""
    return {
        "page_collection_id": str(row.id),
        "collection_id": str(row.collection_id),
        "parent_id": _str(row.page.parent_id),
        "sort_order": row.sort_order,
        "page": page_data(row.page),
    }


class CollectionPagesAddSerializer(serializers.Serializer):
    page_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    sort_orders = serializers.DictField(child=serializers.FloatField(), required=False)
    placement = serializers.JSONField(required=False)


class CollectionPageUpdateSerializer(serializers.Serializer):
    collection = serializers.UUIDField(required=False)
    sort_order = serializers.FloatField(required=False)
    placement = serializers.JSONField(required=False)


# ── Work item ↔ page links ───────────────────────────────────────────────────


def work_item_page_data(row) -> dict:
    """plane-sdk `WorkItemPage`."""
    page = row.page
    return {
        "id": str(row.id),
        "page": {
            "id": str(page.id),
            "name": page.name,
            "created_at": page.created_at,
            "updated_at": page.updated_at,
            "created_by": _str(page.created_by_id),
            "is_global": page.is_global,
            "logo_props": page.logo_props,
            "access": page.access,
        },
        "issue": str(row.issue_id),
        "project": str(row.project_id),
        "workspace": str(row.workspace_id),
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "created_by": _str(row.created_by_id),
        "updated_by": _str(row.updated_by_id),
    }


class WorkItemPageCreateSerializer(serializers.Serializer):
    page_id = serializers.UUIDField()


# ── Estimates ────────────────────────────────────────────────────────────────


class NexusEstimateSerializer(EstimateSerializer):
    """CE's public estimate serializer, accepting every estimate system the web
    app offers (CE's model choices omit "time", which the web app does show)."""

    type = serializers.ChoiceField(choices=ESTIMATE_TYPES, required=False)
