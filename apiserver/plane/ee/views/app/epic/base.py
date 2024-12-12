# Python imports
import json
from django.db import connection

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import F, Func, OuterRef, Q, UUIDField, Value, Case, When, Count
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.bgtasks.issue_activities_task import issue_activity
from plane.ee.models import EpicUserProperties, ProjectFeature
from plane.db.models import (
    Issue,
    FileAsset,
    IssueLink,
    Project,
    IssueType,
    Workspace,
    ProjectIssueType,
)
from plane.utils.issue_filters import issue_filters
from plane.utils.order_queryset import order_issue_queryset
from plane.ee.views.base import BaseViewSet, BaseAPIView
from plane.ee.serializers import (
    EpicCreateSerializer,
    EpicSerializer,
    EpicDetailSerializer,
    EpicUserPropertySerializer,
    IssueTypeSerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.grouper import (
    issue_group_values,
    issue_on_results,
    issue_queryset_grouper,
)
from plane.utils.paginator import GroupedOffsetPaginator, SubGroupedOffsetPaginator


class EpicViewSet(BaseViewSet):
    def get_queryset(self):
        return (
            Issue.objects.filter(project_id=self.kwargs.get("project_id"))
            .filter(type__is_epic=True)
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
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
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True)
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
        ).distinct()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    def create(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id)
        epic = IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=True,
            level=1,
            is_active=True,
        ).first()

        if not epic:
            return Response(
                {"error": "Epic is not enabled for this project"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EpicCreateSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "type_id": epic.id,
            },
        )

        if serializer.is_valid():
            serializer.save()

            # Track the epic activity
            issue_activity.delay(
                type="epic.activity.created",
                requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(serializer.data.get("id", None)),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    def list(self, request, slug, project_id):
        filters = issue_filters(request.query_params, "GET")
        epics = self.get_queryset().filter(**filters)
        order_by_param = request.GET.get("order_by", "-created_at")

        # epics queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=epics, order_by_param=order_by_param
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

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
                        on_results=lambda issues: issue_on_results(
                            group_by=group_by, issues=issues, sub_group_by=sub_group_by
                        ),
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
                            Q(issue_intake__status=1)
                            | Q(issue_intake__status=-1)
                            | Q(issue_intake__status=2)
                            | Q(issue_intake__isnull=True),
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
            else:
                # Group paginate
                return self.paginate(
                    request=request,
                    order_by=order_by_param,
                    queryset=issue_queryset,
                    on_results=lambda issues: issue_on_results(
                        group_by=group_by, issues=issues, sub_group_by=sub_group_by
                    ),
                    paginator_cls=GroupedOffsetPaginator,
                    group_by_fields=issue_group_values(
                        field=group_by,
                        slug=slug,
                        project_id=project_id,
                        filters=filters,
                    ),
                    group_by_field_name=group_by,
                    count_filter=Q(
                        Q(issue_intake__status=1)
                        | Q(issue_intake__status=-1)
                        | Q(issue_intake__status=2)
                        | Q(issue_intake__isnull=True),
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
        else:
            return self.paginate(
                order_by=order_by_param,
                request=request,
                queryset=issue_queryset,
                on_results=lambda issues: issue_on_results(
                    group_by=group_by, issues=issues, sub_group_by=sub_group_by
                ),
            )

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], creator=True, model=Issue
    )
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    def retrieve(self, request, slug, project_id, pk=None):
        epic = self.get_queryset().filter(pk=pk).first()
        if not epic:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EpicDetailSerializer(epic, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue
    )
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    def partial_update(self, request, slug, project_id, pk=None):
        epic = self.get_queryset().filter(pk=pk).first()
        if not epic:
            return Response(
                {"error": "Epic not found"}, status=status.HTTP_404_NOT_FOUND
            )

        current_instance = json.dumps(EpicSerializer(epic).data, cls=DjangoJSONEncoder)

        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        serializer = EpicCreateSerializer(epic, data=request.data, partial=True)
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

            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], creator=True, model=Issue)
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    def destroy(self, request, slug, project_id, pk=None):
        issue = Issue.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk, type__is_epic=True
        )

        Issue.objects.filter(parent_id=pk).update(parent_id=None)
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

    @allow_permission([ROLE.ADMIN])
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    def epic_status(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        is_epic_enabled = request.data.get("is_epic_enabled", False)
        if is_epic_enabled:
            project_feature, _ = ProjectFeature.objects.get_or_create(
                project_id=project_id
            )
            if not project_feature.is_epic_enabled:
                project_feature.is_epic_enabled = True
                project_feature.save()

            epic, _ = IssueType.objects.get_or_create(
                workspace_id=workspace.id, is_epic=True, level=1
            )

            project_feature, _ = ProjectIssueType.objects.get_or_create(
                project_id=project_id, issue_type_id=epic.id
            )

            return Response(IssueTypeSerializer(epic).data, status=status.HTTP_200_OK)
        else:
            project_feature, _ = ProjectFeature.objects.get_or_create(
                project_id=project_id
            )
            if project_feature.is_epic_enabled:
                project_feature.is_epic_enabled = False
                project_feature.save()

            return Response(status=status.HTTP_204_NO_CONTENT)


class EpicUserDisplayPropertyEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    def patch(self, request, slug, project_id):
        epic_property = EpicUserProperties.objects.get(
            user=request.user, project_id=project_id
        )

        epic_property.filters = request.data.get("filters", epic_property.filters)
        epic_property.display_filters = request.data.get(
            "display_filters", epic_property.display_filters
        )
        epic_property.display_properties = request.data.get(
            "display_properties", epic_property.display_properties
        )
        epic_property.save()
        serializer = EpicUserPropertySerializer(epic_property)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    def get(self, request, slug, project_id):
        issue_property, _ = EpicUserProperties.objects.get_or_create(
            user=request.user, project_id=project_id
        )
        serializer = EpicUserPropertySerializer(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)


def get_all_related_issues(issue_id):
    query = """
    WITH RECURSIVE Descendants AS (
        -- Base case: Start with the given parent issue
        SELECT id, parent_id
        FROM issues
        WHERE parent_id = %s

        UNION ALL

        -- Recursive case: Find children of each issue
        SELECT i.id, i.parent_id
        FROM issues i
        INNER JOIN Descendants d ON i.parent_id = d.id
    )
    SELECT id
    FROM Descendants;
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [issue_id])
        result = cursor.fetchall()

    # Extract IDs from the result
    descendant_ids = [row[0] for row in result]

    # Return as a queryset
    return descendant_ids


class EpicAnalyticsEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.EPICS_DISPLAY)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id, epic_id):
        issue_ids = get_all_related_issues(epic_id)

        if not issue_ids:
            return Response(
                {
                    "backlog_issues": 0,
                    "unstarted_issues": 0,
                    "started_issues": 0,
                    "completed_issues": 0,
                    "cancelled_issues": 0,
                    "overdue_issues": 0,
                },
                status=status.HTTP_200_OK,
            )
        # Annotate the counts for different states in one query
        issues = Issue.objects.filter(
            id__in=issue_ids, project_id=project_id, workspace__slug=slug
        ).aggregate(
            backlog_issues=Count("id", filter=Q(state__group="backlog")),
            unstarted_issues=Count("id", filter=Q(state__group="unstarted")),
            started_issues=Count("id", filter=Q(state__group="started")),
            completed_issues=Count("id", filter=Q(state__group="completed")),
            cancelled_issues=Count("id", filter=Q(state__group="cancelled")),
            overdue_issues=Count("id", filter=Q(target_date__lt=timezone.now())),
        )

        return Response(issues, status=status.HTTP_200_OK)
