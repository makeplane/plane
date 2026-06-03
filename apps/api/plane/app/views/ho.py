# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from django.contrib.auth import get_user_model
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import Count, Prefetch, Sum, Q

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from plane.app.serializers.ho import HoIssueSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    Department,
    DepartmentTaskCategory,
    Issue,
    IssueAssignee,
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
        member=user, is_active=True, deleted_at__isnull=True
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
        is_active=True,
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
            member=user, role=20, is_active=True, deleted_at__isnull=True,
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


class HoWorklogBreakdownPagination(PageNumberPagination):
    """Smaller page size for in-popover lists (members / per-user work items)."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


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
    "state__group",
    "-state__group",
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
    "project__is_bank_wide",
    "-project__is_bank_wide",
    "sub_issues_count",
    "-sub_issues_count",
    "reference_link_count",
    "-reference_link_count",
}


class HoIssueListView(BaseAPIView):
    """GET /api/ho/issues/ — paginated cross-workspace issue list."""

    def get(self, request):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Optional workspace filter — narrow to one or more workspaces by ID (comma-separated)
        workspace_id = request.query_params.get("workspace_id")
        if workspace_id:
            allowed = {str(wid) for wid in workspace_ids}
            requested = [wid.strip() for wid in workspace_id.split(",") if wid.strip()]
            if not requested or any(wid not in allowed for wid in requested):
                return Response({"detail": "Workspace not found or inaccessible."}, status=status.HTTP_404_NOT_FOUND)
            workspace_ids = requested

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
        include_sub_issues = request.query_params.get("include_sub_issues", "false").lower() == "true"

        scope_q = _get_user_scope_q(request.user, workspace_ids)
        base_filters = {
            "is_draft": False,
            "deleted_at__isnull": True,
        }
        if not include_archived:
            base_filters["archived_at__isnull"] = True
            base_filters["project__archived_at__isnull"] = True
        # Default: show only level-1 (parent-less) work items. Toggle includes sub-items.
        if not include_sub_issues:
            base_filters["parent__isnull"] = True
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
                Prefetch(
                    "assignees",
                    queryset=get_user_model().objects.filter(
                        issue_assignee__deleted_at__isnull=True
                    ).distinct(),
                ),
                "issue_module__module",
                "issue_cycle__cycle",
            )
            .annotate(
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
            qs = qs.filter(state__group__in=state.split(","))

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
            qs = qs.filter(project__is_bank_wide=bank_wide.lower() == "true")

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

        # Default datasheet sort: hierarchical A-Z (department → project → main → sub → workitem).
        # When user explicitly picks a different sort column, honor it then fall back to created_at.
        if order_by == "project__workspace__name":
            qs = qs.order_by(
                "project__workspace__name",
                "project__name",
                "main_task_category__name",
                "sub_task_category__name",
                "name",
                "created_at",
            )
        else:
            qs = qs.order_by(order_by, "created_at")

        # Overlap filter: include issues where [start_date, target_date] overlaps [from_date, to_date]
        # Skip target_date lower-bound when progress filter is active (progress already filters by target_date)
        if from_date and not progress:
            qs = qs.filter(Q(target_date__gte=from_date) | Q(target_date__isnull=True))
        if to_date:
            qs = qs.filter(Q(start_date__lte=to_date) | Q(start_date__isnull=True))

        paginator = HoIssuePagination()
        page = paginator.paginate_queryset(qs, request)
        # Aggregate assignees across each row's subtree (issue + descendants) in one batched CTE.
        subtree_assignees = _subtree_assignees_map([str(i.id) for i in page]) if page else {}
        serializer = HoIssueSerializer(page, many=True, context={"subtree_assignees": subtree_assignees})
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
                        "sub_task_category_description": sub.description or None,
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
        accessible_workspace_ids = get_accessible_workspace_ids(request.user)
        if not accessible_workspace_ids:
            return Response({}, status=status.HTTP_200_OK)

        # Optional workspace/project filters to narrow down options (comma-separated)
        workspace_id = request.query_params.get("workspace_id")
        narrowed_workspace_ids = accessible_workspace_ids
        if workspace_id:
            allowed = {str(wid) for wid in accessible_workspace_ids}
            requested = [wid.strip() for wid in workspace_id.split(",") if wid.strip() in allowed]
            if requested:
                narrowed_workspace_ids = requested

        project_ids_param = request.query_params.get("project_id")
        project_ids = []
        if project_ids_param:
            raw_ids = [pid.strip() for pid in project_ids_param.split(",") if pid.strip()]
            project_ids = list(
                Project.objects.filter(id__in=raw_ids, workspace_id__in=narrowed_workspace_ids).values_list(
                    "id", flat=True
                )
            )

        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")
        include_archived = request.query_params.get("include_archived", "true").lower() == "true"

        def _build_qs(ws_ids, apply_project_filter=True):
            kw = {"workspace_id__in": ws_ids, "is_draft": False, "deleted_at__isnull": True}
            if not include_archived:
                kw["archived_at__isnull"] = True
                kw["project__archived_at__isnull"] = True
            qs = Issue.objects.filter(**kw).filter(_get_user_scope_q(request.user, ws_ids))
            if apply_project_filter and project_ids:
                qs = qs.filter(project_id__in=project_ids)
            if from_date:
                qs = qs.filter(Q(target_date__gte=from_date) | Q(target_date__isnull=True))
            if to_date:
                qs = qs.filter(Q(start_date__lte=to_date) | Q(start_date__isnull=True))
            return qs

        # Materialize the main facet pool once to avoid re-evaluating the subquery
        # against the issue table for every facet (~17 round-trips reduced to ~6).
        issue_ids = list(
            _build_qs(narrowed_workspace_ids).values_list("id", flat=True).distinct()
        )

        # Workspace / project facet pools stay as subqueries since each is consumed
        # exactly once below.
        workspaces_issue_ids_sq = (
            _build_qs(accessible_workspace_ids, apply_project_filter=False)
            .values_list("id", flat=True)
            .distinct()
        )
        projects_issue_ids_sq = (
            _build_qs(narrowed_workspace_ids, apply_project_filter=False)
            .values_list("id", flat=True)
            .distinct()
        )

        # Single aggregate query for the six simple facets (states / priorities /
        # main_cats / sub_cats / cycles / modules). Each ArrayAgg(distinct=True)
        # emits a separate FILTER-aware aggregation but in one SQL statement.
        if issue_ids:
            facets = Issue.objects.filter(id__in=issue_ids).aggregate(
                states=ArrayAgg("state__group", distinct=True, filter=Q(state__isnull=False)),
                raw_priorities=ArrayAgg("priority", distinct=True, filter=Q(priority__isnull=False)),
                main_cats=ArrayAgg(
                    "main_task_category__name",
                    distinct=True,
                    filter=Q(main_task_category__isnull=False),
                ),
                sub_cats=ArrayAgg(
                    "sub_task_category__name",
                    distinct=True,
                    filter=Q(sub_task_category__isnull=False),
                ),
                cycles=ArrayAgg(
                    "issue_cycle__cycle__name",
                    distinct=True,
                    filter=Q(issue_cycle__cycle__isnull=False),
                ),
                modules=ArrayAgg(
                    "issue_module__module__name",
                    distinct=True,
                    filter=Q(issue_module__module__isnull=False),
                ),
            )
        else:
            facets = {k: [] for k in ("states", "raw_priorities", "main_cats", "sub_cats", "cycles", "modules")}

        states = facets.get("states") or []
        raw_priorities = facets.get("raw_priorities") or []
        priorities = sorted({p.lower() for p in raw_priorities if p})
        main_cats = facets.get("main_cats") or []
        sub_cats = facets.get("sub_cats") or []
        cycles = facets.get("cycles") or []
        modules = facets.get("modules") or []

        # Users: resolve assignees and leads via single queries each (subquery in SQL).
        User = get_user_model()
        assignees_list = [
            {"id": str(a["id"]), "display_name": a["display_name"]}
            for a in (
                User.objects.filter(
                    id__in=IssueAssignee.objects.filter(
                        issue_id__in=issue_ids,
                        deleted_at__isnull=True,
                    ).values("assignee_id")
                )
                .values("id", "display_name")
                .order_by("display_name")
                .distinct()
            )
        ]
        leads_list = [
            {"id": str(lead["id"]), "display_name": lead["display_name"]}
            for lead in (
                User.objects.filter(
                    id__in=Project.objects.filter(project_issue__id__in=issue_ids)
                    .exclude(project_lead__isnull=True)
                    .values("project_lead_id")
                )
                .values("id", "display_name")
                .order_by("display_name")
                .distinct()
            )
        ]

        # Workspaces / projects — single query each with subquery; "department" filter shows
        # workspaces holding visible issues regardless of current workspace_id selection.
        workspaces_list = [
            {"id": str(w.id), "name": w.name}
            for w in Workspace.objects.filter(
                id__in=Issue.objects.filter(id__in=workspaces_issue_ids_sq).values("workspace_id")
            )
            .only("id", "name")
            .order_by("name")
            .distinct()
        ]
        projects_list = [
            {"id": str(p.id), "name": p.name}
            for p in Project.objects.filter(
                id__in=Issue.objects.filter(id__in=projects_issue_ids_sq).values("project_id")
            )
            .only("id", "name")
            .order_by("name")
            .distinct()
        ]

        return Response({
            "states": sorted(set(states)),
            "main_task_categories": sorted(set(main_cats)),
            "sub_task_categories": sorted(set(sub_cats)),
            "cycles": sorted(set(cycles)),
            "modules": sorted(set(modules)),
            "assignees": assignees_list,
            "leads": leads_list,
            "workspaces": workspaces_list,
            "projects": projects_list,
            "priorities": priorities,
            "progress": ["off_track", "due_today", "at_risk", "on_track"],
        }, status=status.HTTP_200_OK)


def _issue_subtree_ids(root_id):
    """Return list of issue IDs in the subtree rooted at root_id (inclusive).

    Uses a recursive CTE over Issue.parent_id, restricted to non-deleted, non-archived
    issues. Returns at most 10 levels deep as a safety bound against pathological data.
    """
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute(
            """
            WITH RECURSIVE subtree AS (
                SELECT id, 1 AS depth
                FROM issues
                WHERE id = %s AND deleted_at IS NULL AND archived_at IS NULL
                UNION ALL
                SELECT i.id, s.depth + 1
                FROM issues i
                INNER JOIN subtree s ON i.parent_id = s.id
                WHERE i.deleted_at IS NULL AND i.archived_at IS NULL AND s.depth < 10
            )
            SELECT id FROM subtree
            """,
            [str(root_id)],
        )
        return [row[0] for row in cursor.fetchall()]


def _subtree_assignees_map(root_ids):
    """Return {root_id_str: [{id, display_name, avatar}, ...]} — union of assignees
    from each root issue and its descendants (inclusive, depth-bounded at 10).

    One batched recursive CTE keyed by `root_id` so a single query covers the full page.
    Excludes soft-deleted/archived issues and soft-deleted assignee rows.
    """
    if not root_ids:
        return {}
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute(
            """
            WITH RECURSIVE subtree AS (
                SELECT id AS root_id, id, 1 AS depth
                FROM issues
                WHERE id = ANY(%s::uuid[])
                  AND deleted_at IS NULL
                  AND archived_at IS NULL
                UNION ALL
                SELECT s.root_id, i.id, s.depth + 1
                FROM issues i
                INNER JOIN subtree s ON i.parent_id = s.id
                WHERE i.deleted_at IS NULL
                  AND i.archived_at IS NULL
                  AND s.depth < 10
            )
            SELECT DISTINCT s.root_id, u.id, u.display_name, COALESCE(u.avatar, '')
            FROM subtree s
            INNER JOIN issue_assignees ia
                ON ia.issue_id = s.id AND ia.deleted_at IS NULL
            INNER JOIN users u ON u.id = ia.assignee_id
            ORDER BY s.root_id, u.display_name
            """,
            [list(root_ids)],
        )
        result = {}
        for root_id, user_id, display_name, avatar in cursor.fetchall():
            result.setdefault(str(root_id), []).append(
                {"id": str(user_id), "display_name": display_name, "avatar": avatar}
            )
        return result


class HoIssueWorklogBreakdownView(BaseAPIView):
    """GET /api/ho/issues/<issue_id>/worklogs/ — subtree-wide worklog breakdown.

    Returns the total minutes across the issue + all descendants, plus per-user totals.
    Uses HO workspace-level permissions instead of project membership.
    """

    def get(self, request, issue_id):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        issue_exists = Issue.objects.filter(
            id=issue_id,
            workspace_id__in=workspace_ids,
            deleted_at__isnull=True,
            archived_at__isnull=True,
        ).exists()
        if not issue_exists:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        subtree_ids = _issue_subtree_ids(issue_id)

        # Full subtree total (computed once, not paginated)
        total_minutes = (
            IssueWorkLog.objects.filter(issue_id__in=subtree_ids).aggregate(
                total=Sum("duration_minutes")
            )["total"]
            or 0
        )

        # Per-user totals across subtree (SoftDeletionManager excludes deleted logs)
        breakdown_qs = (
            IssueWorkLog.objects.filter(issue_id__in=subtree_ids)
            .values("logged_by")
            .annotate(total_minutes=Sum("duration_minutes"))
            .order_by("-total_minutes")
        )

        paginator = HoWorklogBreakdownPagination()
        page = paginator.paginate_queryset(breakdown_qs, request) or []

        User = get_user_model()
        user_ids = [row["logged_by"] for row in page]
        user_map = {
            str(u.id): {"display_name": u.display_name, "avatar_url": u.avatar or ""}
            for u in User.objects.filter(id__in=user_ids).only("id", "display_name", "avatar")
        }

        members = [
            {
                "user_id": str(row["logged_by"]),
                "display_name": user_map.get(str(row["logged_by"]), {}).get("display_name", ""),
                "avatar_url": user_map.get(str(row["logged_by"]), {}).get("avatar_url", ""),
                "total_minutes": row["total_minutes"],
            }
            for row in page
        ]
        count = paginator.page.paginator.count if paginator.page else len(members)
        return Response(
            {
                "total_minutes": total_minutes,
                "count": count,
                "next": paginator.get_next_link() if paginator.page else None,
                "previous": paginator.get_previous_link() if paginator.page else None,
                "members": members,
            },
            status=status.HTTP_200_OK,
        )


class HoIssueWorklogByUserView(BaseAPIView):
    """GET /api/ho/issues/<issue_id>/worklogs/by-user/<user_id>/ — per-work-item totals
    for one user within the issue subtree (inclusive)."""

    def get(self, request, issue_id, user_id):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        issue_exists = Issue.objects.filter(
            id=issue_id,
            workspace_id__in=workspace_ids,
            deleted_at__isnull=True,
            archived_at__isnull=True,
        ).exists()
        if not issue_exists:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        subtree_ids = _issue_subtree_ids(issue_id)

        rows_qs = (
            IssueWorkLog.objects.filter(issue_id__in=subtree_ids, logged_by_id=user_id)
            .values("issue_id", "issue__name", "issue__project__name")
            .annotate(total_minutes=Sum("duration_minutes"))
            .order_by("-total_minutes")
        )

        paginator = HoWorklogBreakdownPagination()
        page = paginator.paginate_queryset(rows_qs, request) or []

        result = [
            {
                "issue_id": str(row["issue_id"]),
                "issue_name": row["issue__name"] or "",
                "project_name": row["issue__project__name"] or "",
                "total_minutes": row["total_minutes"],
            }
            for row in page
        ]
        return paginator.get_paginated_response(result)


class HoAccessibleWorkspacesView(BaseAPIView):
    """GET /api/ho/workspaces/ - list workspaces the user is a member of with their projects."""

    def get(self, request):
        # Use direct membership only — no org chart/department check
        member_ws_ids = list(
            WorkspaceMember.objects.filter(
                member=request.user,
                is_active=True,
                deleted_at__isnull=True,
            ).values_list("workspace_id", flat=True)
        )
        if not member_ws_ids:
            return Response([], status=status.HTTP_200_OK)

        workspaces = (
            Workspace.objects.filter(id__in=member_ws_ids)
            .select_related("logo_asset")
            .prefetch_related("workspace_project")
            .order_by("name")
        )

        # Reverse OneToOne `linked_department` raises RelatedObjectDoesNotExist when missing
        # (caught by BaseAPIView as 404). Fetch departments separately and map by workspace_id.
        dept_by_ws_id = {
            d.linked_workspace_id: d
            for d in Department.objects.filter(
                linked_workspace_id__in=member_ws_ids,
                deleted_at__isnull=True,
            )
        }

        # Cross-reference ProjectMember to return only projects the requesting user belongs to.
        # Prevents leaking private/secret project names (e.g. "Executive Compensation Q4") to
        # HO users who can see the workspace but are not project members.
        user_project_ids = set(
            ProjectMember.objects.filter(
                member=request.user,
                is_active=True,
                project__workspace_id__in=member_ws_ids,
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

            dept = dept_by_ws_id.get(ws.id)
            result.append(
                {
                    "id": str(ws.id),
                    "name": ws.name,
                    "slug": ws.slug,
                    "logo_url": ws.logo_url,
                    "department_id": str(dept.id) if dept else None,
                    "department_name": dept.name if dept else None,
                    "projects": [
                        {"id": str(p["id"]), "name": p["name"], "identifier": p["identifier"]} for p in projects
                    ],
                }
            )

        return Response(result, status=status.HTTP_200_OK)


