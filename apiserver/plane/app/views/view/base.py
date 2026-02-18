# Python imports
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

# Django imports
from rest_framework.pagination import PageNumberPagination
from django.db.models import (
    Exists,
    F,
    Func,
    OuterRef,
    Q,
)
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import (
    allow_permission,
    ROLE,
)
from plane.app.serializers import (
    IssueViewSerializer,
    BaseSerializer,
)
from plane.db.models import (
    Issue,
    FileAsset,
    IssueLabel,
    IssueAssignee,
    IssueLink,
    IssueView,
    Workspace,
    WorkspaceMember,
    ProjectMember,
    Project,
    IssueCustomProperty
)
from plane.utils.grouper import (
    issue_group_values,
)
from plane.utils.issue_filters import issue_filters, build_custom_property_q_objects, apply_user_hub_filters
from plane.utils.constants import ALLOWED_CUSTOM_PROPERTY_WORKSPACE_MAP
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.paginator import (
    GroupedOffsetPaginator,
    SubGroupedOffsetPaginator,
)
from plane.bgtasks.recent_visited_task import recent_visited_task
from .. import BaseViewSet
from plane.db.models import (
    UserFavorite,
)

class IssueCustomPropertySerializer(BaseSerializer):
    class Meta:
        model = IssueCustomProperty
        fields = ["key", "value", "issue_type_custom_property", "data_type"]
        read_only_fields = [
            "id",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

class WorkspaceViewViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(workspace_id=workspace.id, owned_by=self.request.user)

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .select_related("workspace")
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST],
        level="WORKSPACE",
    )
    def list(self, request, slug):
        queryset = self.get_queryset()
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        if WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member=request.user,
            role=5,
            is_active=True,
        ).exists():
            queryset = queryset.filter(owned_by=request.user)
        views = IssueViewSerializer(
            queryset, many=True, fields=fields if fields else None
        ).data
        return Response(views, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[], level="WORKSPACE", creator=True, model=IssueView
    )
    def partial_update(self, request, slug, pk):
        with transaction.atomic():
            workspace_view = IssueView.objects.select_for_update().get(
                pk=pk,
                workspace__slug=slug,
            )

            if workspace_view.is_locked:
                return Response(
                    {"error": "view is locked"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Only update the view if owner is updating
            if workspace_view.owned_by_id != request.user.id:
                return Response(
                    {
                        "error": "Only the owner of the view can update the view"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IssueViewSerializer(
                workspace_view, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, slug, pk):
        issue_view = self.get_queryset().filter(pk=pk).first()
        serializer = IssueViewSerializer(issue_view)
        recent_visited_task.delay(
            slug=slug,
            project_id=None,
            entity_name="view",
            entity_identifier=pk,
            user_id=request.user.id,
        )
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @allow_permission(
        allowed_roles=[],
        level="WORKSPACE",
        creator=True,
        model=IssueView,
    )
    def destroy(self, request, slug, pk):
        workspace_view = IssueView.objects.get(
            pk=pk,
            workspace__slug=slug,
        )

        workspace_member = WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member=request.user,
            role=20,
            is_active=True,
        )
        if (
            workspace_member.exists()
            or workspace_view.owned_by == request.user
        ):
            workspace_view.delete()
            # Delete the user favorite view
            UserFavorite.objects.filter(
                workspace__slug=slug,
                entity_identifier=pk,
                project__isnull=True,
                entity_type="view",
            ).delete()
        else:
            return Response(
                {"error": "Only admin or owner can delete the view"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceViewIssuesViewSet(BaseViewSet):
    def get_queryset(self, filters):
        """Phase 1 queryset: lean, for filtering + ordering + pagination only.

        No select_related, no JOIN-based membership filter (Exists instead)
        → no duplicate rows → no DISTINCT needed.
        No correlated subqueries (sub_issues_count, link_count, attachment_count)
        — those run in Phase 2 on the small paginated ID set.
        No ArrayAgg annotations — batch-loaded after pagination.
        """
        custom_properties = filters.get("custom_properties", {})
        custom_filters = build_custom_property_q_objects(custom_properties)
        queryset = (
            Issue.issue_objects
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                Exists(
                    ProjectMember.objects.filter(
                        project_id=OuterRef("project_id"),
                        member=self.request.user,
                        is_active=True,
                    )
                )
            )
            # Phase 1: NO select_related — Exists filters add no JOIN columns,
            # no duplicate rows, no DISTINCT needed.
            # Phase 1: NO correlated subqueries — they run in Phase 2 on ~100 IDs
            .filter(
                *custom_filters
            )
        )
        return apply_user_hub_filters(queryset, self.request.user, workspace_slug=self.kwargs.get("slug"))

    @staticmethod
    def _build_detail_queryset(page_ids):
        """Phase 2: fetch full details + counts for a small set of IDs.

        Correlated subqueries are cheap here because they run on ~100 rows
        instead of the entire candidate set (10k+).
        """
        return (
            Issue.issue_objects.filter(id__in=page_ids)
            .annotate(
                sub_issues_count=Issue.objects.filter(
                    parent=OuterRef("id"),
                    deleted_at__isnull=True,
                    is_draft=False,
                    archived_at__isnull=True,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count"),
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count"),
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count"),
            )
        )

    @method_decorator(gzip_page)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST],
        level="WORKSPACE",
    )

    def listCustomProperty(self, request, slug):
        customPropertyAllowedKeys = ALLOWED_CUSTOM_PROPERTY_WORKSPACE_MAP.get(slug, [])
        field = request.GET.get("field", "")
        query = request.GET.get("query", "")

        custom_properties = IssueCustomProperty.objects.filter(key__in=customPropertyAllowedKeys)
        if field:
            custom_properties = custom_properties.filter(key=field)
        if field and query:
            custom_properties = custom_properties.filter(key=field, value__icontains=query)

        serializer = IssueCustomPropertySerializer(custom_properties, many=True)

        groupedCustomProperties = {}
        for item in serializer.data:
            key = item.get("key")
            value = item.get("value")
            data_type = item.get("data_type")

            if not value or key not in customPropertyAllowedKeys:
                continue

            bucket = groupedCustomProperties.setdefault(
                key, {"values": set(), "data_type": data_type}
            )
            bucket["values"].add(value)

        groupedUniqueCustomProperties = {
            key: {
                "values": list(info["values"]),
                "data_type": info["data_type"],
            }
            for key, info in groupedCustomProperties.items()
        }

        unique_values_list = [
            {
                "key": key,
                "data_type": info["data_type"],
                "values": info["values"],
            }
            for key, info in groupedUniqueCustomProperties.items()
]

        response_data = {}
        if (not unique_values_list and field):
            response_data[field] = {
                "data": [],
                "total_results": 0,
                "limit": 10,
                "total_pages": 1,
                "page": 1,
                "data_type": None
            }
        
        for item in unique_values_list:
            key = item["key"]
            values = item["values"]
            data_type = item["data_type"]
            
            paginator = PageNumberPagination()
            paginator.page_size = int(request.GET.get("limit", 10))
            paginated_values = paginator.paginate_queryset(values, request) or []
            
            response_data[key] = {
                "total_results": len(values),
                "page": paginator.page.number if hasattr(paginator, 'page') else 1,
                "limit": paginator.page.paginator.per_page if hasattr(paginator, 'page') else len(values),
                "total_pages": paginator.page.paginator.num_pages if hasattr(paginator, 'page') else 1,
                "data": paginated_values,
                "data_type": data_type
            }
        
        return Response(response_data, status=status.HTTP_200_OK)

    @staticmethod
    def _enrich_issues_with_relations(results_list):
        """Batch-load label_ids, assignee_ids, custom_propertiess for paginated issues."""
        if not results_list:
            return results_list

        issue_ids = list({r["id"] for r in results_list})

        # label_ids
        label_map = defaultdict(list)
        for iid, lid in IssueLabel.objects.filter(
            issue_id__in=issue_ids, deleted_at__isnull=True
        ).values_list("issue_id", "label_id"):
            label_map[iid].append(lid)

        # assignee_ids
        assignee_map = defaultdict(list)
        for iid, aid in IssueAssignee.objects.filter(
            issue_id__in=issue_ids, deleted_at__isnull=True
        ).values_list("issue_id", "assignee_id"):
            assignee_map[iid].append(aid)

        # custom_propertiess
        cp_map = defaultdict(list)
        for row in IssueCustomProperty.objects.filter(
            issue_id__in=issue_ids, key__isnull=False
        ).values("issue_id", "key", "value"):
            cp_map[row["issue_id"]].append({row["key"]: row["value"]})

        for r in results_list:
            iid = r["id"]
            r["label_ids"] = label_map.get(iid, [])
            r["assignee_ids"] = assignee_map.get(iid, [])
            r["custom_propertiess"] = cp_map.get(iid, [])
            # Removed fields -- send explicit defaults so frontend can hide columns
            r["cycle_id"] = None
            r["module_ids"] = []
            r["estimate_point"] = None
            r["worker_name"] = None

        return results_list

    def list(self, request, slug):
        filters = issue_filters(request.query_params, "GET")
        filtersWithoutCustomProperties = filters.copy()
        filtersWithoutCustomProperties.pop('custom_properties', None)
        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = (
            self.get_queryset(filters)
            .filter(**filtersWithoutCustomProperties)
        )

        # check for the project member role, if the role is 5 then check for the guest_view_all_features if it is true then show all the issues else show only the issues created by the user

        guest_pm = ProjectMember.objects.filter(
            project_id=OuterRef("project_id"),
            member=self.request.user,
            is_active=True,
            role=5,
        )
        non_guest_pm = ProjectMember.objects.filter(
            project_id=OuterRef("project_id"),
            member=self.request.user,
            is_active=True,
            role__gt=5,
        )
        issue_queryset = issue_queryset.filter(
            Exists(non_guest_pm)
            | (Exists(guest_pm) & Q(project__guest_view_all_features=True))
            | (Exists(guest_pm) & Q(project__guest_view_all_features=False) & Q(created_by=self.request.user))
        )

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset,
            order_by_param=order_by_param,
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        # ── Two-phase query strategy ──
        # Phase 1 (issue_queryset) is lean: only filters + ordering + pagination.
        #   No select_related, no correlated subqueries → narrow DISTINCT, fast sort.
        # Phase 2 (_build_detail_queryset) fetches counts + fields for the ~100 IDs
        #   returned by Phase 1.  Correlated subqueries on ~100 rows are trivial.
        # M2M relations (labels, assignees, custom_properties) are batch-loaded in
        #   _enrich_issues_with_relations after Phase 2.

        # M2M fields that need the raw FK in .values() when used as group_by
        FIELD_MAPPER = {
            "labels__id": "label_ids",
            "assignees__id": "assignee_ids",
        }

        # Fields fetched in Phase 2 (includes annotated counts)
        detail_fields = [
            "id", "name", "state_id", "sort_order", "completed_at",
            "priority", "start_date", "target_date", "sequence_id",
            "project_id", "parent_id", "sub_issues_count",
            "created_at", "updated_at", "created_by", "updated_by",
            "attachment_count", "link_count", "is_draft", "archived_at",
            "state__group", "trip_reference_number", "reference_number",
            "hub_code", "hub_name", "customer_code", "customer_name",
            "vendor_name", "vendor_code", "worker_code", "business_type",
        ]

        has_m2m_group = group_by and group_by in FIELD_MAPPER
        has_m2m_subgroup = sub_group_by and sub_group_by in FIELD_MAPPER

        def on_results_fn(issues):
            """Two-phase callback: Phase 1 → IDs, Phase 2 → details + counts."""
            # ── Phase 1: extract IDs (+ M2M group keys if needed) ──
            phase1_fields = ["id"]
            if has_m2m_group:
                phase1_fields.append(group_by)
            if has_m2m_subgroup:
                phase1_fields.append(sub_group_by)

            phase1_rows = list(issues.values(*phase1_fields))
            # Ordered-unique IDs (preserves Phase 1 sort order)
            page_ids = list(dict.fromkeys(r["id"] for r in phase1_rows))

            if not page_ids:
                return []

            # ── Phase 2: detail query on the small ID set ──
            detail_qs_values = self._build_detail_queryset(page_ids).values(*detail_fields)
            print(f"\n[WorkspaceViewIssues] Phase 2 SQL ({len(page_ids)} IDs):\n{detail_qs_values.query}\n")
            results = list(detail_qs_values)
            id_to_result = {r["id"]: r for r in results}

            if has_m2m_group or has_m2m_subgroup:
                # For M2M grouping the paginator produced multiple rows per issue
                # (one per M2M value).  Reconstruct those pairs so process_results
                # can group correctly.
                merged = []
                for p1 in phase1_rows:
                    base = id_to_result.get(p1["id"])
                    if base is None:
                        continue
                    row = dict(base)  # shallow copy — avoid mutating shared dict
                    if has_m2m_group:
                        row[group_by] = p1[group_by]
                    if has_m2m_subgroup:
                        row[sub_group_by] = p1[sub_group_by]
                    merged.append(row)
                results = merged
            else:
                # Preserve Phase 1 ordering
                results = [id_to_result[pid] for pid in page_ids if pid in id_to_result]

            return self._enrich_issues_with_relations(results)

        # Log Phase 1 SQL for analysis (print so it's visible regardless of log level)
        print(f"\n[WorkspaceViewIssues] Phase 1 SQL (slug={slug}, group_by={group_by}, sub_group_by={sub_group_by}):\n{issue_queryset.query}\n")

        if group_by:
            # Check group and sub group value paginate
            if sub_group_by:
                if group_by == sub_group_by:
                    return Response(
                        {
                            "error": "Group by and sub group by cannot have same parameters"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    # group and sub group pagination
                    return self.paginate(
                        request=request,
                        order_by=order_by_param,
                        queryset=issue_queryset,
                        on_results=on_results_fn,
                        paginator_cls=SubGroupedOffsetPaginator,
                        group_by_fields=issue_group_values(
                            field=group_by,
                            slug=slug,
                            project_id=None,
                            filters=filters,
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by,
                            slug=slug,
                            project_id=None,
                            filters=filters,
                        ),
                        group_by_field_name=group_by,
                        sub_group_by_field_name=sub_group_by,
                        count_filter=Q(
                            Q(issue_inbox__status=1)
                            | Q(issue_inbox__status=-1)
                            | Q(issue_inbox__status=2)
                            | Q(issue_inbox__isnull=True),
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                        skip_count=True,
                    )
            # Group Paginate
            else:
                # Group paginate
                return self.paginate(
                    request=request,
                    order_by=order_by_param,
                    queryset=issue_queryset,
                    on_results=on_results_fn,
                    paginator_cls=GroupedOffsetPaginator,
                    group_by_fields=issue_group_values(
                        field=group_by,
                        slug=slug,
                        project_id=None,
                        filters=filters,
                    ),
                    group_by_field_name=group_by,
                    count_filter=Q(
                        Q(issue_inbox__status=1)
                        | Q(issue_inbox__status=-1)
                        | Q(issue_inbox__status=2)
                        | Q(issue_inbox__isnull=True),
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                    skip_count=True,
                )
        else:
            # List Paginate
            return self.paginate(
                order_by=order_by_param,
                request=request,
                queryset=issue_queryset,
                on_results=on_results_fn,
                skip_count=True,
            )


class IssueViewViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            owned_by=self.request.user,
        )

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="view",
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .select_related("project")
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-is_favorite", "name")
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        project = Project.objects.get(id=project_id)
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
        ):
            queryset = queryset.filter(owned_by=request.user)
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        views = IssueViewSerializer(
            queryset, many=True, fields=fields if fields else None
        ).data
        return Response(views, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        issue_view = (
            self.get_queryset().filter(pk=pk, project_id=project_id).first()
        )
        project = Project.objects.get(id=project_id)
        """
        if the role is guest and guest_view_all_features is false and owned by is not 
        the requesting user then dont show the view
        """

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not issue_view.owned_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueViewSerializer(issue_view)
        recent_visited_task.delay(
            slug=slug,
            project_id=project_id,
            entity_name="view",
            entity_identifier=pk,
            user_id=request.user.id,
        )
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[], creator=True, model=IssueView)
    def partial_update(self, request, slug, project_id, pk):
        with transaction.atomic():
            issue_view = IssueView.objects.select_for_update().get(
                pk=pk, workspace__slug=slug, project_id=project_id
            )

            if issue_view.is_locked:
                return Response(
                    {"error": "view is locked"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Only update the view if owner is updating
            if issue_view.owned_by_id != request.user.id:
                return Response(
                    {
                        "error": "Only the owner of the view can update the view"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IssueViewSerializer(
                issue_view, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

    @allow_permission(
        allowed_roles=[ROLE.ADMIN], creator=True, model=IssueView
    )
    def destroy(self, request, slug, project_id, pk):
        project_view = IssueView.objects.get(
            pk=pk,
            project_id=project_id,
            workspace__slug=slug,
        )
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=20,
                is_active=True,
            ).exists()
            or project_view.owned_by_id == request.user.id
        ):
            project_view.delete()
            # Delete the user favorite view
            UserFavorite.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                entity_identifier=pk,
                entity_type="view",
            ).delete()
        else:
            return Response(
                {"error": "Only admin or owner can delete the view"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueViewFavoriteViewSet(BaseViewSet):
    model = UserFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("view")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        _ = UserFavorite.objects.create(
            user=request.user,
            entity_identifier=request.data.get("view"),
            entity_type="view",
            project_id=project_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, view_id):
        view_favorite = UserFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_type="view",
            entity_identifier=view_id,
        )
        view_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
