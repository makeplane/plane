# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    Count,
    Exists,
    FloatField,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    Sum,
    UUIDField,
    Value,
)
from django.db.models.functions import Cast, Coalesce

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, Module, ModuleLink, UserFavorite
from plane.app.permissions import WorkspaceViewerPermission
from plane.app.serializers.module import ModuleSerializer


class WorkspaceModulesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        # Subqueries for the computed fields that ModuleSerializer exposes.
        # These mirror ModuleViewSet.get_queryset (the project-scoped endpoint)
        # so the same serializer is fed the same annotations here.
        favorite_subquery = UserFavorite.objects.filter(
            user=request.user,
            entity_type="module",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )
        total_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(total_estimate_points=Sum(Cast("estimate_point__value", FloatField())))
            .values("total_estimate_points")[:1]
        )
        completed_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="completed",
                issue_module__module_id=OuterRef("pk"),
                issue_module__deleted_at__isnull=True,
            )
            .values("issue_module__module_id")
            .annotate(completed_estimate_points=Sum(Cast("estimate_point__value", FloatField())))
            .values("completed_estimate_points")[:1]
        )

        modules = (
            Module.objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("project")
            .select_related("workspace")
            .select_related("lead")
            .prefetch_related("members")
            .filter(archived_at__isnull=True)
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related("module", "created_by"),
                )
            )
            # Computed fields required by ModuleSerializer. Without these
            # annotations `member_ids`, `is_favorite` and the estimate-point
            # fields are resolved per row while serializing, which turns the
            # list into an N+1 (one members lookup per module).
            .annotate(is_favorite=Exists(favorite_subquery))
            .annotate(
                member_ids=Coalesce(
                    ArrayAgg(
                        "members__id",
                        distinct=True,
                        filter=Q(
                            members__id__isnull=False,
                            modulemember__deleted_at__isnull=True,
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .annotate(
                total_estimate_points=Coalesce(
                    Subquery(total_estimate_point), Value(0, output_field=FloatField())
                )
            )
            .annotate(
                completed_estimate_points=Coalesce(
                    Subquery(completed_estimate_point), Value(0, output_field=FloatField())
                )
            )
            .annotate(
                total_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__state__group="completed",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__state__group="cancelled",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__state__group="started",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__state__group="unstarted",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_module",
                    filter=Q(
                        issue_module__issue__state__group="backlog",
                        issue_module__issue__archived_at__isnull=True,
                        issue_module__issue__is_draft=False,
                        issue_module__deleted_at__isnull=True,
                    ),
                    distinct=True,
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

        serializer = ModuleSerializer(modules, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)
