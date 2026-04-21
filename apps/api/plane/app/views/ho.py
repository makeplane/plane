# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from django.contrib.auth import get_user_model
from django.db.models import Count, OuterRef, Prefetch, Subquery, Sum, Q
from django.db.models.functions import Coalesce

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from plane.app.serializers.ho import HoIssueSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    Department,
    DepartmentTaskCategory,
    Issue,
    IssueWorkLog,
    Project,
    ProjectMember,
    StaffProfile,
    SubTaskCategory,
    Workspace,
    WorkspaceMember,
)
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


def _get_accessible_dept_ids(user):
    """Return department IDs accessible to the user in HO context.

    - Instance admin: all departments.
    - Dept manager: own department + all descendants.
    - Regular member: departments linked to joined workspaces + all ancestors.
    """
    if _is_instance_admin(user):
        return list(Department.objects.filter(deleted_at__isnull=True).values_list("id", flat=True))

    managed_dept_ids_qs = StaffProfile.objects.filter(
        user=user,
        is_department_manager=True,
        deleted_at__isnull=True,
    ).values_list("department_id", flat=True)

    if managed_dept_ids_qs.exists():
        dept_ids = []
        for dept_id in managed_dept_ids_qs:
            if dept_id:
                dept_ids.extend(_get_all_descendant_dept_ids(dept_id))
        return list(set(dept_ids))

    # Regular member: departments linked to joined workspaces + all ancestors
    member_ws_ids = WorkspaceMember.objects.filter(
        member=user, deleted_at__isnull=True
    ).values_list("workspace_id", flat=True)
    depts = Department.objects.filter(
        linked_workspace_id__in=member_ws_ids,
        deleted_at__isnull=True,
    ).select_related("parent__parent__parent__parent__parent")
    dept_ids: set = set()
    for dept in depts:
        current = dept
        while current is not None:
            dept_ids.add(current.id)
            current = current.parent
    return list(dept_ids)


def get_accessible_workspace_ids(user):
    """Return workspace IDs the user can access in HO context.

    - Instance admins see all workspaces.
    - Department managers see only workspaces linked to their managed departments (and descendants).
    - Workspace members see the workspaces they belong to.
    """
    if _is_instance_admin(user):
        return list(Workspace.objects.values_list("id", flat=True))

    accessible_ids = set()

    # 1. Add workspaces where user is a member
    member_ws_ids = WorkspaceMember.objects.filter(
        member=user,
        deleted_at__isnull=True,
    ).values_list("workspace_id", flat=True)
    accessible_ids.update(member_ws_ids)

    # 2. Add workspaces linked to managed departments
    managed_staff = StaffProfile.objects.filter(
        user=user,
        is_department_manager=True,
        deleted_at__isnull=True,
    ).values_list("department_id", flat=True)

    dept_ids = []
    for dept_id in managed_staff:
        if dept_id:
            dept_ids.extend(_get_all_descendant_dept_ids(dept_id))

    if dept_ids:
        dept_ws_ids = Department.objects.filter(
            id__in=dept_ids,
            linked_workspace__isnull=False,
            deleted_at__isnull=True
        ).values_list("linked_workspace_id", flat=True)
        accessible_ids.update(dept_ws_ids)

    return list(accessible_ids)


def _get_user_scope_q(user, workspace_ids):
    """Return a Q filter scoping issues to what the user is allowed to see.

    - Instance admin or dept manager: all issues in accessible workspaces.
    - Workspace admin (role=20): all issues in those admin workspaces.
    - Regular member: only issues assigned to the user in their member workspaces.
    """
    if _is_instance_admin(user):
        return Q(workspace_id__in=workspace_ids)

    is_dept_manager = StaffProfile.objects.filter(
        user=user, is_department_manager=True, deleted_at__isnull=True
    ).exists()
    if is_dept_manager:
        return Q(workspace_id__in=workspace_ids)

    # Split accessible workspaces by admin role
    admin_ws_ids = set(
        WorkspaceMember.objects.filter(
            member=user, role=20, deleted_at__isnull=True,
            workspace_id__in=workspace_ids
        ).values_list("workspace_id", flat=True)
    )
    member_only_ws_ids = set(workspace_ids) - admin_ws_ids

    q = Q()
    if admin_ws_ids:
        q |= Q(workspace_id__in=admin_ws_ids)
    if member_only_ws_ids:
        q |= Q(workspace_id__in=member_only_ws_ids, assignees=user)
    return q if q else Q(pk__in=[])


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
    "completed_at",
    "-completed_at",
    "created_at",
    "-created_at",
    "name",
    "-name",
    "project__project_lead__display_name",
    "-project__project_lead__display_name",
    "is_bank_wide_project",
    "-is_bank_wide_project",
    "sub_issues_count",
    "-sub_issues_count",
    "reference_link_count",
    "-reference_link_count",
    "total_log_time",
    "-total_log_time",
}


class HoIssueListView(BaseAPIView):
    """GET /api/ho/issues/ — paginated cross-workspace issue list."""

    def get(self, request):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Optional department filter: narrow to workspace linked to that department
        department_id = request.query_params.get("department_id")
        if department_id:
            ws = Workspace.objects.filter(linked_department_id=department_id, id__in=workspace_ids).first()
            if ws:
                workspace_ids = [ws.id]
            else:
                return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)

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
        include_archived = request.query_params.get("include_archived", "true").lower() == "true"

        scope_q = _get_user_scope_q(request.user, workspace_ids)
        base_filters = {
            "is_draft": False,
            "deleted_at__isnull": True,
        }
        if not include_archived:
            base_filters["archived_at__isnull"] = True
            base_filters["project__archived_at__isnull"] = True
        qs = (
            Issue.objects.filter(
                scope_q,
                **base_filters,
            )
            .distinct()
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
                # Use correlated subquery to avoid JOIN multiplication when scope_q
                # adds M2M joins (assignees) that create N rows per issue, which would
                # inflate SUM(duration_minutes) by the number of assignees.
                total_log_time=Coalesce(
                    Subquery(
                        IssueWorkLog.objects  # SoftDeletionManager already excludes deleted records
                        .filter(issue_id=OuterRef("pk"))
                        .values("issue_id")
                        .annotate(total=Sum("duration_minutes"))
                        .values("total")
                    ),
                    0,
                ),
                sub_issues_count=Count("parent_issue", distinct=True),
                reference_link_count=Count("issue_link", distinct=True),
            )
        )

        # Apply project filter if provided
        if project_ids:
            qs = qs.filter(project_id__in=project_ids)

        # Apply additional filters
        priority = request.query_params.get("priority")
        if priority:
            qs = qs.filter(priority__in=priority.split(","))

        state = request.query_params.get("state")
        if state:
            qs = qs.filter(state__name__in=state.split(","))

        assignees = request.query_params.get("assignees")
        if assignees:
            qs = qs.filter(assignees__id__in=assignees.split(",")).distinct()

        leads = request.query_params.get("leads")
        if leads:
            qs = qs.filter(project__project_lead_id__in=leads.split(","))

        main_task_category = request.query_params.get("main_task_category")
        if main_task_category:
            qs = qs.filter(main_task_category__name__in=main_task_category.split(","))

        sub_task_category = request.query_params.get("sub_task_category")
        if sub_task_category:
            qs = qs.filter(sub_task_category__name__in=sub_task_category.split(","))

        cycle = request.query_params.get("cycle")
        if cycle:
            qs = qs.filter(issue_cycle__cycle__name__in=cycle.split(","))

        module = request.query_params.get("module")
        if module:
            qs = qs.filter(issue_module__module__name__in=module.split(","))

        bank_wide = request.query_params.get("bank_wide")
        if bank_wide:
            qs = qs.filter(is_bank_wide_project=bank_wide.lower() == "true")

        progress = request.query_params.get("progress")
        if progress:
            from datetime import timedelta
            from django.utils import timezone
            today = timezone.now().date()
            tomorrow = today + timedelta(days=1)
            p_filters = Q()
            for p in progress.split(","):
                if p == "off_track":
                    p_filters |= Q(target_date__lt=today)
                elif p == "due_today":
                    p_filters |= Q(target_date=today)
                elif p == "at_risk":
                    p_filters |= Q(target_date=tomorrow)
                elif p == "on_track":
                    p_filters |= Q(target_date__gt=tomorrow)
            if p_filters:
                qs = qs.filter(p_filters)

        qs = qs.order_by(order_by, "created_at")

        # Overlap filter: include issues where [start_date, target_date] overlaps [from_date, to_date]
        # Skip target_date lower-bound when progress filter is active (progress already filters by target_date)
        if from_date and not progress:
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
        # Build accessible department IDs directly — do NOT go through workspace_ids,
        # because departments (e.g. Head Office) may have no linked_workspace.
        accessible_dept_ids = _get_accessible_dept_ids(request.user)

        if not accessible_dept_ids:
            return Response([], status=status.HTTP_200_OK)

        # Fetch task categories linked to accessible departments
        dept_cat_qs = (
            DepartmentTaskCategory.objects.filter(
                department_id__in=accessible_dept_ids,
                deleted_at__isnull=True,
                main_task_category__is_active=True,
                department__deleted_at__isnull=True,
            )
            .select_related("department", "main_task_category")
            .prefetch_related(
                Prefetch(
                    "main_task_category__sub_categories",
                    queryset=SubTaskCategory.objects.filter(
                        is_active=True, deleted_at__isnull=True
                    ).order_by("sort_order", "name"),
                )
            )
            .order_by(
                "department__name",
                "main_task_category__sort_order",
                "main_task_category__name",
            )
        )

        # Optional category name filters
        main_task_category = request.query_params.get("main_task_category")
        if main_task_category:
            dept_cat_qs = dept_cat_qs.filter(main_task_category__name__in=main_task_category.split(","))

        sub_task_category_filter = request.query_params.get("sub_task_category")

        result = []
        for dept_cat in dept_cat_qs:
            main_cat = dept_cat.main_task_category
            subs = list(main_cat.sub_categories.all())
            if sub_task_category_filter:
                subs = [s for s in subs if s.name in sub_task_category_filter.split(",")]

            if subs:
                for sub in subs:
                    result.append({
                        "department_id": str(dept_cat.department.id),
                        "department_name": dept_cat.department.name,
                        "main_task_category_name": main_cat.name,
                        "main_task_category_description": main_cat.description or None,
                        "sub_task_category_name": sub.name,
                    })
            elif not sub_task_category_filter:
                # Show main-only row when no sub-category filter is active
                result.append({
                    "department_id": str(dept_cat.department.id),
                    "department_name": dept_cat.department.name,
                    "main_task_category_name": main_cat.name,
                    "main_task_category_description": main_cat.description or None,
                    "sub_task_category_name": None,
                })

        return Response(result, status=status.HTTP_200_OK)


class HoFilterOptionsView(BaseAPIView):
    """GET /api/ho/filter-options/ - return unique values for filters."""

    def get(self, request):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({}, status=status.HTTP_200_OK)

        # Optional department/project filters to narrow down options
        department_id = request.query_params.get("department_id")
        if department_id:
            ws = Workspace.objects.filter(linked_department_id=department_id, id__in=workspace_ids).first()
            if ws:
                workspace_ids = [ws.id]

        project_ids_param = request.query_params.get("project_id")
        project_ids = []
        if project_ids_param:
            raw_ids = [pid.strip() for pid in project_ids_param.split(",") if pid.strip()]
            project_ids = list(
                Project.objects.filter(id__in=raw_ids, workspace_id__in=workspace_ids).values_list("id", flat=True)
            )

        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")
        include_archived = request.query_params.get("include_archived", "true").lower() == "true"

        filter_kwargs = {
            "workspace_id__in": workspace_ids,
            "is_draft": False,
            "deleted_at__isnull": True,
        }
        if not include_archived:
            filter_kwargs["archived_at__isnull"] = True
            filter_kwargs["project__archived_at__isnull"] = True
        base_qs = Issue.objects.filter(**filter_kwargs)
        scope_q = _get_user_scope_q(request.user, workspace_ids)
        base_qs = base_qs.filter(scope_q)
        if project_ids:
            base_qs = base_qs.filter(project_id__in=project_ids)
        if from_date:
            base_qs = base_qs.filter(Q(target_date__gte=from_date) | Q(target_date__isnull=True))
        if to_date:
            base_qs = base_qs.filter(Q(start_date__lte=to_date) | Q(start_date__isnull=True))

        # Fix for duplicates: collect IDs first then extract distinct values
        issue_ids = base_qs.values_list("id", flat=True).distinct()

        # Extract options
        states = (
            Issue.objects.filter(id__in=issue_ids)
            .exclude(state__isnull=True)
            .values_list("state__name", flat=True)
            .distinct()
            .order_by("state__name")
        )
        raw_priorities = (
            Issue.objects.filter(id__in=issue_ids)
            .exclude(priority__isnull=True)
            .values_list("priority", flat=True)
            .distinct()
        )
        priorities = sorted(list(set(p.lower() for p in raw_priorities if p)))

        main_cats = (
            Issue.objects.filter(id__in=issue_ids)
            .exclude(main_task_category__isnull=True)
            .values_list("main_task_category__name", flat=True)
            .distinct()
            .order_by("main_task_category__name")
        )
        sub_cats = (
            Issue.objects.filter(id__in=issue_ids)
            .exclude(sub_task_category__isnull=True)
            .values_list("sub_task_category__name", flat=True)
            .distinct()
            .order_by("sub_task_category__name")
        )

        cycles = (
            Issue.objects.filter(id__in=issue_ids, issue_cycle__cycle__isnull=False)
            .values_list("issue_cycle__cycle__name", flat=True)
            .distinct()
            .order_by("issue_cycle__cycle__name")
        )
        modules = (
            Issue.objects.filter(id__in=issue_ids, issue_module__module__isnull=False)
            .values_list("issue_module__module__name", flat=True)
            .distinct()
            .order_by("issue_module__module__name")
        )

        # Assignees: get User IDs from issue_assignees, then resolve display names
        User = get_user_model()
        assignee_user_ids = (
            Issue.objects.filter(id__in=issue_ids)
            .values_list("issue_assignee__assignee_id", flat=True)
            .distinct()
        )
        assignees = (
            User.objects.filter(id__in=assignee_user_ids)
            .values("id", "display_name")
            .order_by("display_name")
        )
        assignees_list = [
            {"id": str(a["id"]), "display_name": a["display_name"]}
            for a in assignees
        ]

        # Leads: get project lead User IDs, then resolve display names
        lead_user_ids = (
            Project.objects.filter(project_issue__id__in=issue_ids)
            .exclude(project_lead__isnull=True)
            .values_list("project_lead_id", flat=True)
            .distinct()
        )
        leads = (
            User.objects.filter(id__in=lead_user_ids)
            .values("id", "display_name")
            .order_by("display_name")
        )
        leads_list = [
            {"id": str(lead["id"]), "display_name": lead["display_name"]}
            for lead in leads
        ]

        return Response({
            "states": sorted(list(set(states))),
            "main_task_categories": sorted(list(set(main_cats))),
            "sub_task_categories": sorted(list(set(sub_cats))),
            "cycles": sorted(list(set(cycles))),
            "modules": sorted(list(set(modules))),
            "assignees": assignees_list,
            "leads": leads_list,
            "priorities": priorities,
            "progress": ["off_track", "due_today", "at_risk", "on_track"],
        }, status=status.HTTP_200_OK)


class HoIssueWorklogBreakdownView(BaseAPIView):
    """GET /api/ho/issues/<issue_id>/worklogs/ — per-user worklog totals for a single HO issue.

    Uses HO workspace-level permissions instead of project membership, so HO users
    who are not project members can still see the breakdown (fixing the mismatch
    with total_log_time shown in the datasheet which is annotated without membership filter).
    """

    def get(self, request, issue_id):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Verify issue belongs to an accessible workspace
        issue_exists = Issue.objects.filter(
            id=issue_id,
            workspace_id__in=workspace_ids,
            deleted_at__isnull=True,
            archived_at__isnull=True,
        ).exists()
        if not issue_exists:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Aggregate total minutes per user (SoftDeletionManager already excludes deleted records)
        breakdown = (
            IssueWorkLog.objects.filter(issue_id=issue_id)
            .values("logged_by")
            .annotate(total_minutes=Sum("duration_minutes"))
            .order_by("-total_minutes")
        )

        # Fetch user display details in one query
        User = get_user_model()
        user_ids = [row["logged_by"] for row in breakdown]
        user_map = {
            str(u.id): {"display_name": u.display_name, "avatar_url": u.avatar or ""}
            for u in User.objects.filter(id__in=user_ids).only("id", "display_name", "avatar")
        }

        result = [
            {
                "user_id": str(row["logged_by"]),
                "display_name": user_map.get(str(row["logged_by"]), {}).get("display_name", ""),
                "avatar_url": user_map.get(str(row["logged_by"]), {}).get("avatar_url", ""),
                "total_minutes": row["total_minutes"],
            }
            for row in breakdown
        ]
        return Response(result, status=status.HTTP_200_OK)


class HoAccessibleWorkspacesView(BaseAPIView):
    """GET /api/ho/workspaces/ - list workspaces accessible to user with their projects."""

    def get(self, request):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response([], status=status.HTTP_200_OK)

        workspaces = (
            Workspace.objects.filter(id__in=workspace_ids, linked_department__isnull=False)
            .select_related("logo_asset", "linked_department")
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
                    "department_id": str(ws.linked_department.id),
                    "department_name": ws.linked_department.name,
                    "projects": [
                        {"id": str(p["id"]), "name": p["name"], "identifier": p["identifier"]} for p in projects
                    ],
                }
            )

        return Response(result, status=status.HTTP_200_OK)


