# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from django.db.models import Count, Sum, Q
from django.db.models.functions import Coalesce

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from plane.app.serializers.ho import HoIssueSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Department, Issue, Project, ProjectMember, StaffProfile, Workspace
from plane.license.models import Instance, InstanceAdmin


# ---------------------------------------------------------------------------
# Access control helpers
# ---------------------------------------------------------------------------


def _is_instance_admin(user):
    """Check if the user is an instance admin using the InstanceAdmin model."""
    instance = Instance.objects.first()
    if not instance:
        return False
    return InstanceAdmin.objects.filter(instance=instance, user=user).exists()


def _get_all_descendant_dept_ids(dept_id):
    """Python-side BFS to collect all descendant department IDs including root."""
    result = [dept_id]
    children = list(
        Department.objects.filter(parent_id=dept_id, deleted_at__isnull=True).values_list("id", flat=True)
    )
    for child_id in children:
        result.extend(_get_all_descendant_dept_ids(child_id))
    return result


def get_accessible_workspace_ids(user):
    """Return workspace IDs the user can access in HO context.

    Instance admins see all workspaces.
    Department managers see only workspaces linked to their managed departments.
    Returns empty list if user has neither role.
    """
    if _is_instance_admin(user):
        return list(Workspace.objects.values_list("id", flat=True))

    # Collect all department IDs the user manages
    managed_staff = StaffProfile.objects.filter(
        user=user,
        is_department_manager=True,
        deleted_at__isnull=True,
    ).values_list("department_id", flat=True)

    dept_ids = []
    for dept_id in managed_staff:
        if dept_id:
            dept_ids.extend(_get_all_descendant_dept_ids(dept_id))

    if not dept_ids:
        return []

    return list(
        Department.objects.filter(id__in=dept_ids, linked_workspace__isnull=False, deleted_at__isnull=True).values_list(
            "linked_workspace_id", flat=True
        )
    )


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------


class HoIssuePagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 500


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

_ALLOWED_ORDER_BY = {
    "project__workspace__name",
    "-project__workspace__name",
    "project__name",
    "-project__name",
    "main_task_category__name",
    "-main_task_category__name",
    "sub_task_category__name",
    "-sub_task_category__name",
    "priority",
    "-priority",
    "state__name",
    "-state__name",
    "start_date",
    "-start_date",
    "target_date",
    "-target_date",
    "created_at",
    "-created_at",
}


class HoIssueListView(BaseAPIView):
    """GET /api/ho/issues/ — paginated cross-workspace issue list."""

    def get(self, request):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Optional workspace filter
        workspace_slug = request.query_params.get("workspace_slug")
        if workspace_slug:
            ws = Workspace.objects.filter(slug=workspace_slug, id__in=workspace_ids).first()
            if ws:
                workspace_ids = [ws.id]
            else:
                return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        # Optional project filter — validate UUIDs and enforce workspace boundary
        project_ids_param = request.query_params.get("project_id")
        project_ids = []
        if project_ids_param:
            raw_ids = [pid.strip() for pid in project_ids_param.split(",") if pid.strip()]
            # Validate UUID format before hitting ORM (prevents 500 on malformed input)
            try:
                from uuid import UUID

                [UUID(pid) for pid in raw_ids]
            except ValueError:
                return Response({"detail": "Invalid project_id format."}, status=status.HTTP_400_BAD_REQUEST)
            # Validate project IDs belong to accessible workspaces (prevents cross-workspace enumeration)
            project_ids = list(
                Project.objects.filter(id__in=raw_ids, workspace_id__in=workspace_ids).values_list("id", flat=True)
            )
            if len(project_ids) < len(raw_ids):
                return Response(
                    {"detail": "One or more project IDs are invalid or inaccessible."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        order_by = request.query_params.get("order_by", "project__workspace__name")
        if order_by not in _ALLOWED_ORDER_BY:
            order_by = "project__workspace__name"

        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")

        qs = (
            Issue.objects.filter(
                workspace_id__in=workspace_ids,
                is_draft=False,
                archived_at__isnull=True,
                deleted_at__isnull=True,
            )
            .select_related(
                "project",
                "project__workspace",
                "project__project_lead",
                "state",
                "main_task_category",
                "sub_task_category",
            )
            .prefetch_related(
                "assignees",
                "issue_module__module",
                "issue_cycle__cycle",
            )
            .annotate(
                total_log_time=Coalesce(
                    Sum("issue_worklogs__duration_minutes", filter=Q(issue_worklogs__deleted_at__isnull=True)),
                    0,
                ),
                sub_issues_count=Count("parent_issue", distinct=True),
                reference_link_count=Count("issue_link", distinct=True),
            )
        )

        # Apply project filter if provided
        if project_ids:
            qs = qs.filter(project_id__in=project_ids)

        qs = qs.order_by(order_by, "created_at")

        # Overlap filter: include issues where [start_date, target_date] overlaps [from_date, to_date]
        # An issue is active during the range if: start_date <= to_date AND target_date >= from_date
        # Null dates are treated as "unbounded" (include the issue)
        if from_date:
            qs = qs.filter(Q(target_date__gte=from_date) | Q(target_date__isnull=True))
        if to_date:
            qs = qs.filter(Q(start_date__lte=to_date) | Q(start_date__isnull=True))

        paginator = HoIssuePagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = HoIssueSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class HoCategorySummaryView(BaseAPIView):
    """GET /api/ho/category-summary/ — aggregated work item counts per category combination."""

    def get(self, request):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Optional workspace filter
        workspace_slug = request.query_params.get("workspace_slug")
        if workspace_slug:
            ws = Workspace.objects.filter(slug=workspace_slug, id__in=workspace_ids).first()
            if ws:
                workspace_ids = [ws.id]
            else:
                return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        # Optional project filter — validate UUIDs and enforce workspace boundary
        project_ids_param = request.query_params.get("project_id")
        project_ids = []
        if project_ids_param:
            raw_ids = [pid.strip() for pid in project_ids_param.split(",") if pid.strip()]
            # Validate UUID format before hitting ORM (prevents 500 on malformed input)
            try:
                from uuid import UUID

                [UUID(pid) for pid in raw_ids]
            except ValueError:
                return Response({"detail": "Invalid project_id format."}, status=status.HTTP_400_BAD_REQUEST)
            # Validate project IDs belong to accessible workspaces (prevents cross-workspace enumeration)
            project_ids = list(
                Project.objects.filter(id__in=raw_ids, workspace_id__in=workspace_ids).values_list("id", flat=True)
            )
            if len(project_ids) < len(raw_ids):
                return Response(
                    {"detail": "One or more project IDs are invalid or inaccessible."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")

        qs = Issue.objects.filter(
            workspace_id__in=workspace_ids,
            is_draft=False,
            archived_at__isnull=True,
            deleted_at__isnull=True,
        )

        # Apply project filter if provided
        if project_ids:
            qs = qs.filter(project_id__in=project_ids)

        if from_date:
            qs = qs.filter(Q(target_date__gte=from_date) | Q(target_date__isnull=True))
        if to_date:
            qs = qs.filter(Q(start_date__lte=to_date) | Q(start_date__isnull=True))

        summary = list(
            qs.values(
                "project__workspace__name",
                "project__workspace__slug",
                "project_id",
                "project__name",
                "main_task_category__name",
                "sub_task_category__name",
            )
            .annotate(work_item_count=Count("id"))
            .order_by(
                "project__workspace__name",
                "project__name",
                "main_task_category__name",
                "sub_task_category__name",
            )
        )

        # Reshape keys for frontend consumption
        result = [
            {
                "department_name": row["project__workspace__name"],
                "workspace_slug": row["project__workspace__slug"],
                "project_id": str(row["project_id"]),
                "project_name": row["project__name"],
                "main_task_category_name": row["main_task_category__name"],
                "sub_task_category_name": row["sub_task_category__name"],
                "work_item_count": row["work_item_count"],
            }
            for row in summary
        ]

        return Response(result, status=status.HTTP_200_OK)


class HoAccessibleWorkspacesView(BaseAPIView):
    """GET /api/ho/workspaces/ - list workspaces accessible to user with their projects."""

    def get(self, request):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response([], status=status.HTTP_200_OK)

        workspaces = (
            Workspace.objects.filter(id__in=workspace_ids)
            .select_related("logo_asset")
            .prefetch_related("workspace_project")
            .order_by("name")
        )

        # Cross-reference ProjectMember to return only projects the requesting user belongs to.
        # Prevents leaking private/secret project names (e.g. "Executive Compensation Q4") to
        # HO users who can see the workspace but are not project members.
        user_project_ids = set(
            ProjectMember.objects.filter(
                member=request.user,
                is_active=True,
                project__workspace_id__in=workspace_ids,
            ).values_list("project_id", flat=True)
        )

        result = []
        for ws in workspaces:
            projects = (
                ws.workspace_project.filter(
                    deleted_at__isnull=True,
                    archived_at__isnull=True,
                    id__in=user_project_ids,
                )
                .values("id", "name", "identifier")
                .order_by("name")
            )

            result.append(
                {
                    "id": str(ws.id),
                    "name": ws.name,
                    "slug": ws.slug,
                    "logo_url": ws.logo_url,  # Use @property, not raw ws.logo (resolves logo_asset for modern uploads)
                    "projects": [
                        {"id": str(p["id"]), "name": p["name"], "identifier": p["identifier"]} for p in projects
                    ],
                }
            )

        return Response(result, status=status.HTTP_200_OK)
