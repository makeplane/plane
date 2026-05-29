# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Count, Q
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.permissions.workspace import WorkspaceUserPermission
from plane.app.serializers.help_center import HelpCategoryReadSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import HelpCategory, Workspace

from .base import (
    HelpCenterViewSetMixin,
    coerce_sort_order,
    generate_unique_slug,
    pick_slug_source,
    upsert_category_translations,
)

# Reads = any active workspace member; writes = workspace ADMIN only (decorators).
WRITABLE_FIELDS = ("icon", "color", "is_active", "sort_order")


class HelpCategoryViewSet(HelpCenterViewSetMixin, BaseViewSet):
    model = HelpCategory
    serializer_class = HelpCategoryReadSerializer
    permission_classes = [WorkspaceUserPermission]

    def get_queryset(self):
        slug = self.kwargs.get("slug")
        queryset = HelpCategory.objects.filter(workspace__slug=slug).prefetch_related("translations")
        if self.is_admin():
            return queryset.annotate(
                article_count=Count(
                    "articles", filter=Q(articles__deleted_at__isnull=True), distinct=True
                )
            )
        # Members: only active categories that hold >=1 published article. The
        # publish invariant guarantees a published article has a usable
        # translation, so counting published articles is sufficient.
        return (
            queryset.filter(is_active=True)
            .annotate(
                article_count=Count(
                    "articles",
                    filter=Q(articles__status="published", articles__deleted_at__isnull=True),
                    distinct=True,
                )
            )
            .filter(article_count__gt=0)
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        translations = [t for t in (request.data.get("translations") or []) if (t.get("name") or "").strip()]
        if not translations:
            return Response(
                {"error": "At least one locale name is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        category = HelpCategory(
            workspace=workspace,
            slug=generate_unique_slug(HelpCategory, workspace, pick_slug_source(translations, "name")),
            icon=request.data.get("icon", ""),
            color=request.data.get("color", ""),
            is_active=request.data.get("is_active", True),
        )
        category.save()
        upsert_category_translations(category, translations)
        category = self.get_queryset().get(pk=category.id)
        return Response(
            HelpCategoryReadSerializer(category, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        category = self.get_queryset().get(pk=pk)
        for field in WRITABLE_FIELDS:
            if field in request.data:
                value = coerce_sort_order(request.data[field]) if field == "sort_order" else request.data[field]
                setattr(category, field, value)
        category.save()
        if request.data.get("translations"):
            upsert_category_translations(category, request.data["translations"])
        category = self.get_queryset().get(pk=category.id)
        return Response(HelpCategoryReadSerializer(category, context=self.get_serializer_context()).data)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        category = self.get_queryset().get(pk=pk)
        category.delete()  # soft delete (AuditModel)
        return Response(status=status.HTTP_204_NO_CONTENT)
