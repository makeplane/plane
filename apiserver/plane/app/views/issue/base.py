# Python imports
import json
from collections import defaultdict

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.core.serializers.json import DjangoJSONEncoder
from rest_framework.pagination import PageNumberPagination
from django.db.models import (
    Exists,
    F,
    Func,
    OuterRef,
    Prefetch,
    Q,
    UUIDField,
    Value,
    Subquery,
    Case,
    When,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    IssueCreateSerializer,
    IssueDetailSerializer,
    IssueUserPropertySerializer,
    IssueSerializer,
    BaseSerializer,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Issue,
    FileAsset,
    IssueAssignee,
    IssueLabel,
    IssueLink,
    IssueUserProperty,
    IssueReaction,
    IssueSubscriber,
    ModuleIssue,
    Project,
    ProjectMember,
    CycleIssue,
    State,
    IssueCustomProperty,
)
from plane.utils.grouper import (
    issue_group_values,
    issue_queryset_grouper,
)
from plane.utils.issue_filters import issue_filters, build_custom_property_q_objects, apply_user_hub_filters
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.constants import ALLOWED_CUSTOM_PROPERTY_WORKSPACE_MAP
from plane.utils.paginator import (
    GroupedOffsetPaginator,
    SubGroupedOffsetPaginator,
)
from .. import BaseAPIView, BaseViewSet
from plane.utils.user_timezone_converter import user_timezone_converter
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.utils.global_paginator import paginate
from plane.bgtasks.webhook_task import model_activity

from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectLitePermission,
    ProjectMemberPermission,
)

class IssueCustomPropertySerializer(BaseSerializer):
    class Meta:
        model = IssueCustomProperty
        fields = ["key", "value", "issue_type_custom_property"]
        read_only_fields = [
            "id",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

class IssueListEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        issue_ids = request.GET.get("issues", False)

        if not issue_ids:
            return Response(
                {"error": "Issues are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_ids = [
            issue_id for issue_id in issue_ids.split(",") if issue_id != ""
        ]

        queryset = (
            Issue.issue_objects.filter(
                workspace__slug=slug, project_id=project_id, pk__in=issue_ids
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
        )
        queryset = apply_user_hub_filters(queryset, request.user, workspace_slug=slug)
        queryset = (
            queryset.annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(
                        issue=OuterRef("id"), deleted_at__isnull=True
                    ).values("cycle_id")[:1]
                )
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .distinct()
        )

        filters = issue_filters(request.query_params, "GET")

        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset = queryset.filter(**filters)

        # Issue queryset
        issue_queryset, _ = order_issue_queryset(
            issue_queryset=issue_queryset,
            order_by_param=order_by_param,
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        # issue queryset
        issue_queryset = issue_queryset_grouper(
            queryset=issue_queryset,
            group_by=group_by,
            sub_group_by=sub_group_by,
        )

        recent_visited_task.delay(
            slug=slug,
            project_id=project_id,
            entity_name="project",
            entity_identifier=project_id,
            user_id=request.user.id,
        )

        if self.fields or self.expand:
            issues = IssueSerializer(
                queryset, many=True, fields=self.fields, expand=self.expand
            ).data
        else:
            issues = issue_queryset.values(
                "id",
                "name",
                "state_id",
                "sort_order",
                "completed_at",
                "estimate_point",
                "priority",
                "start_date",
                "target_date",
                "sequence_id",
                "project_id",
                "parent_id",
                "cycle_id",
                "module_ids",
                "label_ids",
                "assignee_ids",
                "sub_issues_count",
                "created_at",
                "updated_at",
                "created_by",
                "updated_by",
                "attachment_count",
                "link_count",
                "is_draft",
                "archived_at",
                "deleted_at",
            )
            datetime_fields = ["created_at", "updated_at"]
            issues = user_timezone_converter(
                issues, datetime_fields, request.user.user_timezone
            )
        return Response(issues, status=status.HTTP_200_OK)


class IssueViewSet(BaseViewSet):
    def get_serializer_class(self):
        return (
            IssueCreateSerializer
            if self.action in ["create", "update", "partial_update"]
            else IssueSerializer
        )

    model = Issue
    webhook_event = "issue"

    search_fields = [
        "name",
    ]

    filterset_fields = [
        "state__name",
        "assignees__id",
        "workspace__id",
    ]

    FIELD_MAPPER = {
        "labels__id": "label_ids",
        "assignees__id": "assignee_ids",
        "issue_module__module_id": "module_ids",
    }

    # Fields fetched in Phase 2. cycle_id is absent — injected by _enrich_issues_with_relations.
    DETAIL_FIELDS = [
        "id", "name", "state_id", "sort_order", "completed_at",
        "priority", "start_date", "target_date", "sequence_id",
        "project_id", "parent_id", "sub_issues_count",
        "created_at", "updated_at", "created_by", "updated_by",
        "attachment_count", "link_count", "is_draft", "archived_at",
        "state__group", "trip_reference_number", "reference_number",
        "hub_code", "hub_name", "customer_code", "customer_name",
        "vendor_name", "vendor_code", "worker_code", "worker_name",
        "business_type", "estimate_point", "source", "type_id",
    ]

    def get_queryset(self, filters={}):
        """Phase 1: lean queryset for filtering, ordering, and pagination.

        Uses Issue.objects (base manager) to avoid IssueManager's expensive
        JOINs. Only annotates cycle_id (needed by grouped paginators).
        Expensive counts and M2M arrays are deferred to Phase 2/3.
        """
        custom_properties = filters.get("custom_properties", {})
        custom_filters = build_custom_property_q_objects(custom_properties)
        queryset = (
            Issue.objects
            .filter(
                project_id=self.kwargs.get("project_id"),
                workspace__slug=self.kwargs.get("slug"),
                deleted_at__isnull=True,
                archived_at__isnull=True,
                is_draft=False,
                project__archived_at__isnull=True,
                state_id__isnull=False,
            )
            .filter(
                Q(issue_inbox__status=1)
                | Q(issue_inbox__status=-1)
                | Q(issue_inbox__status=2)
                | Q(issue_inbox__isnull=True)
            )
            .exclude(
                state_id__in=State.objects.filter(is_triage=True).values("id")
            )
            # cycle_id needed for group_by=cycle_id support in grouped paginators.
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(
                        issue=OuterRef("id"),
                        deleted_at__isnull=True,
                    ).values("cycle_id")[:1]
                )
            )
            .filter(*custom_filters)
            .distinct()
        )
        return queryset
    
    def get_queryset_with_hub_filters(self, filters={}):
        """Wrapper around get_queryset that applies user hub filtering."""
        queryset = self.get_queryset(filters)
        return apply_user_hub_filters(queryset, self.request.user, workspace_slug=self.kwargs.get("slug"))

    @staticmethod
    def _build_detail_queryset(page_ids):
        """Phase 2: fetch full details + counts for a small set of IDs.

        Correlated subqueries are cheap here because they run on ~100 rows
        instead of the entire candidate set.
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

    @staticmethod
    def _enrich_issues_with_relations(results_list):
        """Batch-load all M2M and derived fields for paginated issues.

        Runs 5 flat IN-queries on ~100 IDs — no N+1, no row multiplication.
        """
        if not results_list:
            return results_list

        issue_ids = list({r["id"] for r in results_list})

        # label_ids
        label_map = defaultdict(list)
        for iid, lid in IssueLabel.objects.filter(
            issue_id__in=issue_ids, deleted_at__isnull=True
        ).values_list("issue_id", "label_id"):
            label_map[iid].append(lid)

        # assignee_ids — only active project members
        assignee_map = defaultdict(list)
        for iid, aid in IssueAssignee.objects.filter(
            issue_id__in=issue_ids,
            deleted_at__isnull=True,
        ).filter(
            Exists(
                ProjectMember.objects.filter(
                    member_id=OuterRef("assignee_id"),
                    project_id=OuterRef("project_id"),
                    is_active=True,
                    deleted_at__isnull=True,
                )
            )
        ).values_list("issue_id", "assignee_id"):
            assignee_map[iid].append(aid)

        # module_ids (non-archived, non-deleted)
        module_map = defaultdict(list)
        for iid, mid in ModuleIssue.objects.filter(
            issue_id__in=issue_ids,
            deleted_at__isnull=True,
            module__archived_at__isnull=True,
        ).values_list("issue_id", "module_id"):
            module_map[iid].append(mid)

        # cycle_id — take the first active cycle per issue
        cycle_map = {}
        for iid, cid in CycleIssue.objects.filter(
            issue_id__in=issue_ids,
            deleted_at__isnull=True,
        ).values_list("issue_id", "cycle_id"):
            cycle_map.setdefault(iid, cid)

        # custom_property_values
        cp_map = defaultdict(list)
        for row in IssueCustomProperty.objects.filter(
            issue_id__in=issue_ids, key__isnull=False
        ).values("issue_id", "key", "value"):
            cp_map[row["issue_id"]].append({row["key"]: row["value"]})

        for r in results_list:
            iid = r["id"]
            r["label_ids"] = label_map.get(iid, [])
            r["assignee_ids"] = assignee_map.get(iid, [])
            r["module_ids"] = module_map.get(iid, [])
            r["cycle_id"] = cycle_map.get(iid)
            r["custom_property_values"] = cp_map.get(iid, [])

        return results_list

    @method_decorator(gzip_page)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        extra_filters = {}
        if request.GET.get("updated_at__gt", None) is not None:
            extra_filters = {
                "updated_at__gt": request.GET.get("updated_at__gt")
            }

        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        filters = issue_filters(request.query_params, "GET")
        filtersWithoutCustomProperties = filters.copy()
        filtersWithoutCustomProperties.pop('custom_properties', None)
        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = self.get_queryset_with_hub_filters(filters).filter(
            **filtersWithoutCustomProperties, **extra_filters
        )

        # Guest users only see their own issues when guest_view_all_features is disabled.
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
            issue_queryset = issue_queryset.filter(created_by=request.user)

        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset,
            order_by_param=order_by_param,
        )

        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        recent_visited_task.delay(
            slug=slug,
            project_id=project_id,
            entity_name="project",
            entity_identifier=project_id,
            user_id=request.user.id,
        )

        has_m2m_group = group_by and group_by in self.FIELD_MAPPER
        has_m2m_subgroup = sub_group_by and sub_group_by in self.FIELD_MAPPER

        def on_results_fn(issues):
            # Phase 1: extract IDs (+ raw M2M group-by keys if needed).
            phase1_fields = ["id"]
            if has_m2m_group:
                phase1_fields.append(group_by)
            if has_m2m_subgroup:
                phase1_fields.append(sub_group_by)

            phase1_rows = list(issues.values(*phase1_fields))
            page_ids = list(dict.fromkeys(r["id"] for r in phase1_rows))  # ordered-unique

            if not page_ids:
                return []

            # Phase 2: full details + counts on the small ID set.
            detail_qs_values = self._build_detail_queryset(page_ids).values(*self.DETAIL_FIELDS)
            results = list(detail_qs_values)
            id_to_result = {r["id"]: r for r in results}

            if has_m2m_group or has_m2m_subgroup:
                # Re-attach M2M group values to Phase 2 rows for the paginator.
                merged = []
                for p1 in phase1_rows:
                    base = id_to_result.get(p1["id"])
                    if base is None:
                        continue
                    row = dict(base)
                    if has_m2m_group:
                        row[group_by] = p1[group_by]
                    if has_m2m_subgroup:
                        row[sub_group_by] = p1[sub_group_by]
                    merged.append(row)
                results = merged
            else:
                # Restore Phase 1 ordering.
                results = [id_to_result[pid] for pid in page_ids if pid in id_to_result]

            # Phase 3: batch-load M2M arrays and cycle_id.
            return self._enrich_issues_with_relations(results)

        if group_by:
            if sub_group_by:
                if group_by == sub_group_by:
                    return Response(
                        {
                            "error": "Group by and sub group by cannot have same parameters"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    return self.paginate(
                        request=request,
                        order_by=order_by_param,
                        queryset=issue_queryset,
                        on_results=on_results_fn,
                        paginator_cls=SubGroupedOffsetPaginator,
                        group_by_fields=issue_group_values(
                            field=group_by,
                            slug=slug,
                            project_id=project_id,
                            filters=filters,
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by,
                            slug=slug,
                            project_id=project_id,
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
            else:
                return self.paginate(
                    request=request,
                    order_by=order_by_param,
                    queryset=issue_queryset,
                    on_results=on_results_fn,
                    paginator_cls=GroupedOffsetPaginator,
                    group_by_fields=issue_group_values(
                        field=group_by,
                        slug=slug,
                        project_id=project_id,
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
            return self.paginate(
                order_by=order_by_param,
                request=request,
                queryset=issue_queryset,
                on_results=on_results_fn,
                skip_count=True,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id)

        serializer = IssueCreateSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "default_assignee_id": project.default_assignee_id,
            },
        )

        if serializer.is_valid():
            serializer.save()
            print(serializer.data)

            # Track the issue
            issue_activity.delay(
                type="issue.activity.created",
                requested_data=json.dumps(
                    self.request.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(request.user.id),
                issue_id=str(serializer.data.get("id", None)),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            issue_id = serializer.data["id"]
            result = (
                self._build_detail_queryset([issue_id])
                .values(*self.DETAIL_FIELDS, "deleted_at")
                .first()
            )
            if result:
                result = self._enrich_issues_with_relations([result])[0]
            datetime_fields = ["created_at", "updated_at"]
            issue = user_timezone_converter(
                result, datetime_fields, request.user.user_timezone
            )
            # Send the model activity
            model_activity.delay(
                model_name="issue",
                model_id=str(serializer.data["id"]),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(issue, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        allowed_roles=[
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ],
        creator=True,
        model=Issue,
    )
    def retrieve(self, request, slug, project_id, pk=None):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        issue = (
            Issue.objects.filter(
                project_id=self.kwargs.get("project_id")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .annotate(
                cycle_id=Case(
                    When(
                        issue_cycle__cycle__deleted_at__isnull=True,
                        then=F("issue_cycle__cycle_id"),
                    ),
                    default=None,
                )
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
                )
            .filter(pk=pk)
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True),
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(assignees__id__isnull=True)
                            & Q(assignees__member_project__is_active=True)
                            & Q(issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=Q(
                            ~Q(issue_module__module_id__isnull=True)
                            & Q(issue_module__module__archived_at__isnull=True)
                            & Q(issue_module__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .prefetch_related(
                Prefetch(
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related(
                        "issue", "actor"
                    ),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_link",
                    queryset=IssueLink.objects.select_related("created_by"),
                )
            )
            .annotate(
                is_subscribed=Exists(
                    IssueSubscriber.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        issue_id=OuterRef("pk"),
                        subscriber=request.user,
                    )
                )
            )
        ).first()
        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        """
        if the role is guest and guest_view_all_features is false and owned by is not 
        the requesting user then dont show the issue
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
            and not issue.created_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recent_visited_task.delay(
            slug=slug,
            entity_name="issue",
            entity_identifier=pk,
            user_id=request.user.id,
            project_id=project_id,
        )
        
        serializer = IssueDetailSerializer(issue, expand=self.expand)
        print(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue
    )
    def partial_update(self, request, slug, project_id, pk=None):
        issue = (
            self.get_queryset()
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True),
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(assignees__id__isnull=True)
                            & Q(assignees__member_project__is_active=True)
                            & Q(issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=Q(
                            ~Q(issue_module__module_id__isnull=True)
                            & Q(issue_module__module__archived_at__isnull=True)
                            & Q(issue_module__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .filter(pk=pk)
            .first()
        )

        if not issue:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_instance = json.dumps(
            IssueSerializer(issue).data, cls=DjangoJSONEncoder
        )

        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        serializer = IssueCreateSerializer(
            issue, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(pk),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            model_activity.delay(
                model_name="issue",
                model_id=str(serializer.data.get("id", None)),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], creator=True, model=Issue)
    def destroy(self, request, slug, project_id, pk=None):
        issue = Issue.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )

        issue.delete()
        issue_activity.delay(
            type="issue.activity.deleted",
            requested_data=json.dumps({"issue_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(pk),
            project_id=str(project_id),
            current_instance={},
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueUserDisplayPropertyEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def patch(self, request, slug, project_id):
        issue_property = IssueUserProperty.objects.get(
            user=request.user,
            project_id=project_id,
        )

        issue_property.filters = request.data.get(
            "filters", issue_property.filters
        )
        issue_property.display_filters = request.data.get(
            "display_filters", issue_property.display_filters
        )
        issue_property.display_properties = request.data.get(
            "display_properties", issue_property.display_properties
        )
        issue_property.save()
        serializer = IssueUserPropertySerializer(issue_property)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ]
    )
    def get(self, request, slug, project_id):
        issue_property, _ = IssueUserProperty.objects.get_or_create(
            user=request.user, project_id=project_id
        )
        serializer = IssueUserPropertySerializer(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BulkDeleteIssuesEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])

        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issues = Issue.issue_objects.filter(
            workspace__slug=slug, project_id=project_id, pk__in=issue_ids
        )

        total_issues = len(issues)

        issues.delete()

        return Response(
            {"message": f"{total_issues} issues were deleted"},
            status=status.HTTP_200_OK,
        )


class DeletedIssuesListViewSet(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        filters = {}
        if request.GET.get("updated_at__gt", None) is not None:
            filters = {"updated_at__gt": request.GET.get("updated_at__gt")}
        deleted_issues = (
            Issue.all_objects.filter(
                workspace__slug=slug,
                project_id=project_id,
            )
            .filter(Q(archived_at__isnull=False) | Q(deleted_at__isnull=False))
            .filter(**filters)
            .values_list("id", flat=True)
        )

        return Response(deleted_issues, status=status.HTTP_200_OK)


class IssuePaginatedViewSet(BaseViewSet):
    def get_queryset(self):
        workspace_slug = self.kwargs.get("slug")
        project_id = self.kwargs.get("project_id")

        issue_queryset = Issue.issue_objects.filter(
            workspace__slug=workspace_slug, project_id=project_id
        )

        queryset = (
            issue_queryset.select_related(
                "workspace", "project", "state", "parent"
            )
            .prefetch_related("assignees", "labels", "issue_module__module")
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(
                        issue=OuterRef("id"), deleted_at__isnull=True
                    ).values("cycle_id")[:1]
                )
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        ).distinct()
        return apply_user_hub_filters(queryset, self.request.user, workspace_slug=self.kwargs.get("slug"))

    def process_paginated_result(self, fields, results, timezone):
        paginated_data = results.values(*fields)

        # converting the datetime fields in paginated data
        datetime_fields = ["created_at", "updated_at"]
        paginated_data = user_timezone_converter(
            paginated_data, datetime_fields, timezone
        )

        return paginated_data

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        cursor = request.GET.get("cursor", None)
        is_description_required = request.GET.get("description", "false")
        updated_at = request.GET.get("updated_at__gt", None)

        # required fields
        required_fields = [
            "id",
            "name",
            "state_id",
            "state__group",
            "sort_order",
            "completed_at",
            "estimate_point",
            "priority",
            "start_date",
            "target_date",
            "sequence_id",
            "project_id",
            "parent_id",
            "cycle_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "is_draft",
            "archived_at",
            "module_ids",
            "label_ids",
            "assignee_ids",
            "link_count",
            "attachment_count",
            "sub_issues_count",
        ]

        if str(is_description_required).lower() == "true":
            required_fields.append("description_html")

        # querying issues
        base_queryset = Issue.issue_objects.filter(
            workspace__slug=slug, project_id=project_id
        ).order_by("updated_at")
        queryset = self.get_queryset().order_by("updated_at")

        # validation for guest user
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project_member = ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            role=5,
            is_active=True,
        )
        if project_member.exists() and not project.guest_view_all_features:
            base_queryset = base_queryset.filter(created_by=request.user)
            queryset = queryset.filter(created_by=request.user)

        # filtering issues by greater then updated_at given by the user
        if updated_at:
            base_queryset = base_queryset.filter(updated_at__gt=updated_at)
            queryset = queryset.filter(updated_at__gt=updated_at)

        queryset = queryset.annotate(
            label_ids=Coalesce(
                ArrayAgg(
                    "labels__id",
                    distinct=True,
                    filter=Q(
                        ~Q(labels__id__isnull=True)
                        & Q(label_issue__deleted_at__isnull=True),
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            assignee_ids=Coalesce(
                ArrayAgg(
                    "assignees__id",
                    distinct=True,
                    filter=Q(
                        ~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True)
                        & Q(issue_assignee__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            module_ids=Coalesce(
                ArrayAgg(
                    "issue_module__module_id",
                    distinct=True,
                    filter=Q(
                        ~Q(issue_module__module_id__isnull=True)
                        & Q(issue_module__module__archived_at__isnull=True)
                        & Q(issue_module__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
        )

        paginated_data = paginate(
            base_queryset=base_queryset,
            queryset=queryset,
            cursor=cursor,
            on_result=lambda results: self.process_paginated_result(
                required_fields, results, request.user.user_timezone
            ),
        )

        return Response(paginated_data, status=status.HTTP_200_OK)


class IssueDetailEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        filters = issue_filters(request.query_params, "GET")
        issue = (
            Issue.issue_objects.filter(
                workspace__slug=slug, project_id=project_id
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
        )
        issue = apply_user_hub_filters(issue, request.user, workspace_slug=slug)
        issue = (
            issue.annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(
                        issue=OuterRef("id"), deleted_at__isnull=True
                    ).values("cycle_id")[:1]
                )
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True),
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(assignees__id__isnull=True)
                            & Q(assignees__member_project__is_active=True)
                            & Q(issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=Q(
                            ~Q(issue_module__module_id__isnull=True)
                            & Q(issue_module__module__archived_at__isnull=True)
                            & Q(issue_module__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )
        issue = issue.filter(**filters)
        order_by_param = request.GET.get("order_by", "-created_at")
        # Issue queryset
        issue, order_by_param = order_issue_queryset(
            issue_queryset=issue,
            order_by_param=order_by_param,
        )
        return self.paginate(
            request=request,
            order_by=order_by_param,
            queryset=(issue),
            on_results=lambda issue: IssueSerializer(
                issue,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )


class IssueBulkUpdateDateEndpoint(BaseAPIView):

    def validate_dates(
        self, current_start, current_target, new_start, new_target
    ):
        """
        Validate that start date is before target date.
        """
        start = new_start or current_start
        target = new_target or current_target

        if start and target and start > target:
            return False
        return True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):

        updates = request.data.get("updates", [])

        issue_ids = [update["id"] for update in updates]
        epoch = int(timezone.now().timestamp())

        # Fetch all relevant issues in a single query
        issues = list(Issue.objects.filter(id__in=issue_ids))
        issues_dict = {str(issue.id): issue for issue in issues}
        issues_to_update = []

        for update in updates:
            issue_id = update["id"]
            issue = issues_dict.get(issue_id)

            if not issue:
                continue

            start_date = update.get("start_date")
            target_date = update.get("target_date")
            validate_dates = self.validate_dates(
                issue.start_date, issue.target_date, start_date, target_date
            )
            if not validate_dates:
                return Response(
                    {
                        "message": "Start date cannot exceed target date",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if start_date:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps(
                        {"start_date": update.get("start_date")}
                    ),
                    current_instance=json.dumps(
                        {"start_date": str(issue.start_date)}
                    ),
                    issue_id=str(issue_id),
                    actor_id=str(request.user.id),
                    project_id=str(project_id),
                    epoch=epoch,
                )
                issue.start_date = start_date
                issues_to_update.append(issue)

            if target_date:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps(
                        {"target_date": update.get("target_date")}
                    ),
                    current_instance=json.dumps(
                        {"target_date": str(issue.target_date)}
                    ),
                    issue_id=str(issue_id),
                    actor_id=str(request.user.id),
                    project_id=str(project_id),
                    epoch=epoch,
                )
                issue.target_date = target_date
                issues_to_update.append(issue)

        # Bulk update issues
        Issue.objects.bulk_update(
            issues_to_update, ["start_date", "target_date"]
        )

        return Response(
            {"message": "Issues updated successfully"},
            status=status.HTTP_200_OK,
        )

class SearchAPIEndpoint(BaseAPIView):
    model = Issue
    webhook_event = "issue"
    def get(self, request, slug):
        
        allowed_fields = ["hub_code", "hub_name", "worker_code", "worker_name", "reference_number", "trip_reference_number", "customer_code", "customer_name", "vendor_code", "vendor_name", "business_type"]

        field = request.GET.get("field")  # Get the single field value
        query = request.GET.get("query")

        if not field:  # Ensure that 'field' is provided in the request
            return Response(
                {"error": "Missing 'field' parameter. Allowed values: " + ", ".join(allowed_fields)},
                status=status.HTTP_400_BAD_REQUEST
            )

        if field not in allowed_fields:  # Validate the field
            return Response(
                {"error": f"Invalid field. Allowed values: {', '.join(allowed_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch values dynamically based on the requested field
        filter_criteria = {f"{field}__icontains": query} if query else {}

        values_queryset = Issue.objects.filter(
            Q(workspace__slug=slug) & Q(**filter_criteria)
        )
        
        values_queryset = apply_user_hub_filters(values_queryset, request.user, workspace_slug=slug)
        
        if field in ["hub_code", "hub_name"]:
            if getattr(request.user, 'is_super_admin', False):
                # User can see all options - no additional filtering needed
                pass
            else:
                # Filter to only show user's accessible hub_codes or hub_names
                if field == "hub_code":
                    user_hubs = request.user.hub_codes
                    if user_hubs is None:
                        pass
                    elif user_hubs:
                        values_queryset = values_queryset.filter(hub_code__in=user_hubs)
                    else:
                        values_queryset = values_queryset.none()
                elif field == "hub_name":
                    user_hubs = request.user.hub_names
                    if user_hubs is None:
                        pass
                    elif user_hubs:
                        values_queryset = values_queryset.filter(hub_name__in=user_hubs)
                    else:
                        values_queryset = values_queryset.none()

        values = values_queryset.values_list(field, flat=True)

        unique_values = list(set(filter(None, values)))  # Remove duplicates and nulls

        paginator = PageNumberPagination()
        paginator.page_size = int(request.GET.get("limit", 10))  # Default limit = 10
        paginated_values = paginator.paginate_queryset(unique_values, request)

        # Custom pagination response
        response_data = {
            "total_results": len(unique_values),
            "page": paginator.page.number,
            "limit": paginator.page.paginator.per_page,
            "total_pages": paginator.page.paginator.num_pages,
            "data": paginated_values
        }

        return Response(response_data, status=status.HTTP_200_OK)

class SearchSingleValueAPI(BaseAPIView):
    model = Issue
    allowed_fields = ["hub_code", "trip_reference_number", "reference_number", "worker_code", "vendor_code", "customer_code", "business_type"]

    def get(self, request, slug, project_id):
        # Extract query parameters (only one should be provided)
        query_params = {field: request.GET.get(field) for field in self.allowed_fields if request.GET.get(field)}

        if len(query_params) != 1:
            return Response(
                {"error": f"Provide exactly one search parameter from: {', '.join(self.allowed_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract the field and search value
        search_field, search_value = next(iter(query_params.items()))

        # Query for exact matches first
        exact_matches = Issue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            **{search_field: search_value}  # Exact match
        ).values_list(search_field, flat=True)

        # Query for partial matches using `icontains`
        startwith_matches = Issue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            **{f"{search_field}__istartswith": search_value}  # starts with  match
        ).exclude(**{search_field: search_value})  # Exclude exact match
        startwith_matches = startwith_matches.values_list(search_field, flat=True)

        # Combine results: exact matches first, then partial matches
        unique_values = list(set(exact_matches)) + list(set(startwith_matches))

        return Response({"data": unique_values}, status=status.HTTP_200_OK)
