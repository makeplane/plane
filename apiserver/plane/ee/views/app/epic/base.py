# Python imports
import json

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField

from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import (
    F,
    Func,
    OuterRef,
    Q,
    UUIDField,
    Value,
    Case,
    When,
    Count,
    Subquery,
    Exists,
    Prefetch,
)
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.bgtasks.issue_activities_task import issue_activity
from plane.ee.models import EpicUserProperties, ProjectFeature, InitiativeEpic
from plane.db.models import (
    Issue,
    FileAsset,
    IssueLink,
    Project,
    IssueType,
    Workspace,
    CycleIssue,
    ProjectIssueType,
    ProjectMember,
    IssueSubscriber,
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
from plane.utils.grouper import issue_group_values, issue_on_results
from plane.utils.paginator import GroupedOffsetPaginator, SubGroupedOffsetPaginator
from plane.ee.utils.nested_issue_children import get_all_related_issues
from plane.ee.utils.workflow import WorkflowStateManager
from plane.app.views.issue.version import (
    IssueDescriptionVersion,
    IssueDescriptionVersionDetailSerializer,
)
from plane.utils.global_paginator import paginate
from plane.utils.timezone_converter import user_timezone_converter
from plane.bgtasks.issue_description_version_task import issue_description_version_task


class EpicViewSet(BaseViewSet):
    def get_queryset(self):
        return (
            Issue.objects.filter(project_id=self.kwargs.get("project_id"))
            .filter(Q(type__isnull=False) & Q(type__is_epic=True))
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
            .annotate(
                customer_ids=Coalesce(
                    ArrayAgg(
                        "customer_request_issues__customer_id",
                        filter=Q(
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_request__isnull=True,
                            customer_request_issues__issue_id__isnull=False,
                        ),
                        distinct=True,
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                customer_request_ids=Coalesce(
                    ArrayAgg(
                        "customer_request_issues__customer_request_id",
                        filter=Q(
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_request__isnull=False,
                        ),
                        distinct=True,
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .prefetch_related(
                Prefetch(
                    "initiative_epics",
                    queryset=InitiativeEpic.objects.filter(deleted_at__isnull=True),
                )
            )
        ).distinct()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.EPICS)
    def create(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id)
        epic = IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=True,
            level=1,
            is_active=True,
        ).first()

        # EE start
        if request.data.get("state_id"):
            workflow_state_manager = WorkflowStateManager(
                project_id=project_id, slug=slug
            )
            if workflow_state_manager.validate_issue_creation(
                state_id=request.data.get("state_id"), user_id=request.user.id
            ):
                return Response(
                    {"error": "You cannot create a epic in this state"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        # EE end

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
            # updated issue description version
            issue_description_version_task.delay(
                updated_issue=json.dumps(request.data, cls=DjangoJSONEncoder),
                issue_id=str(serializer.data["id"]),
                user_id=request.user.id,
                is_creating=True,
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.EPICS)
    def list(self, request, slug, project_id):
        search = request.GET.get("search", None)

        filters = issue_filters(request.query_params, "GET")
        epics = self.get_queryset().filter(**filters)
        order_by_param = request.GET.get("order_by", "-created_at")

        # Add search functionality
        if search:
            epics = epics.filter(Q(name__icontains=search))

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
                            group_by=group_by,
                            issues=issues,
                            sub_group_by=sub_group_by,
                            slug=slug,
                            user_id=request.user.id,
                        ),
                        paginator_cls=SubGroupedOffsetPaginator,
                        group_by_fields=issue_group_values(
                            field=group_by,
                            slug=slug,
                            project_id=project_id,
                            filters=filters,
                            epic=True,
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by,
                            slug=slug,
                            project_id=project_id,
                            filters=filters,
                            epic=True,
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
                        group_by=group_by,
                        issues=issues,
                        sub_group_by=sub_group_by,
                        slug=slug,
                        user_id=request.user.id,
                    ),
                    paginator_cls=GroupedOffsetPaginator,
                    group_by_fields=issue_group_values(
                        field=group_by,
                        slug=slug,
                        project_id=project_id,
                        filters=filters,
                        epic=True,
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
                    group_by=group_by,
                    issues=issues,
                    sub_group_by=sub_group_by,
                    slug=slug,
                    user_id=request.user.id,
                ),
            )

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], creator=True, model=Issue
    )
    @check_feature_flag(FeatureFlag.EPICS)
    def retrieve(self, request, slug, project_id, pk=None):
        epic = (
            self.get_queryset()
            .filter(pk=pk)
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
            .first()
        )
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
    @check_feature_flag(FeatureFlag.EPICS)
    def partial_update(self, request, slug, project_id, pk=None):
        epic = self.get_queryset().filter(pk=pk).first()
        if not epic:
            return Response(
                {"error": "Epic not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # EE: Check if state is updated then is the transition allowed
        workflow_state_manager = WorkflowStateManager(project_id=project_id, slug=slug)
        if request.data.get(
            "state_id"
        ) and not workflow_state_manager.validate_state_transition(
            issue=epic,
            new_state_id=request.data.get("state_id"),
            user_id=request.user.id,
        ):
            return Response(
                {"error": "State transition is not allowed"},
                status=status.HTTP_403_FORBIDDEN,
            )
        # EE end

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
            # updated issue description version
            issue_description_version_task.delay(
                updated_issue=current_instance,
                issue_id=str(serializer.data.get("id", None)),
                user_id=request.user.id,
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], creator=True, model=Issue)
    @check_feature_flag(FeatureFlag.EPICS)
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
    @check_feature_flag(FeatureFlag.EPICS)
    def epic_status(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        is_epic_enabled = request.data.get("is_epic_enabled", False)
        if is_epic_enabled:
            # get or create the project feature
            project_feature = ProjectFeature.objects.filter(
                project_id=project_id
            ).first()
            if not project_feature:
                project_feature = ProjectFeature.objects.create(project_id=project_id)

            # Check if the epic issue type is already created for the project or not
            project_issue_type = ProjectIssueType.objects.filter(
                project_id=project_id, issue_type__is_epic=True
            ).first()

            if not project_issue_type:
                # create the epic issue type
                epic = IssueType.objects.create(
                    workspace_id=workspace.id, is_epic=True, level=1
                )

                # add it to the project epic issue type
                _ = ProjectIssueType.objects.create(
                    project_id=project_id, issue_type_id=epic.id
                )

            # enable epic issue type
            project_feature.is_epic_enabled = True
            project_feature.save()

            # Refetch the data
            epic = (
                IssueType.objects.filter(
                    workspace__slug=slug,
                    project_issue_types__project_id=project_id,
                    is_epic=True,
                ).annotate(
                    project_ids=Coalesce(
                        Subquery(
                            ProjectIssueType.objects.filter(
                                issue_type=OuterRef("pk"), workspace__slug=slug
                            )
                            .values("issue_type")
                            .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                            .values("project_ids")
                        ),
                        [],
                    )
                )
            ).first()

            return Response(IssueTypeSerializer(epic).data, status=status.HTTP_200_OK)
        else:
            # get or create the project feature
            project_feature = ProjectFeature.objects.filter(
                project_id=project_id
            ).first()
            if not project_feature:
                project_feature = ProjectFeature.objects.create(project_id=project_id)

            if project_feature.is_epic_enabled:
                project_feature.is_epic_enabled = False
                project_feature.save()

            return Response(status=status.HTTP_204_NO_CONTENT)


class EpicUserDisplayPropertyEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.EPICS)
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
    @check_feature_flag(FeatureFlag.EPICS)
    def get(self, request, slug, project_id):
        issue_property, _ = EpicUserProperties.objects.get_or_create(
            user=request.user, project_id=project_id
        )
        serializer = EpicUserPropertySerializer(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EpicAnalyticsEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.EPICS)
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
                },
                status=status.HTTP_200_OK,
            )
        # Annotate the counts for different states in one query
        issues = Issue.issue_objects.filter(
            id__in=issue_ids, project_id=project_id, workspace__slug=slug
        ).aggregate(
            backlog_issues=Count("id", filter=Q(state__group="backlog")),
            unstarted_issues=Count("id", filter=Q(state__group="unstarted")),
            started_issues=Count("id", filter=Q(state__group="started")),
            completed_issues=Count("id", filter=Q(state__group="completed")),
            cancelled_issues=Count("id", filter=Q(state__group="cancelled")),
        )

        return Response(issues, status=status.HTTP_200_OK)


class EpicDetailEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.EPICS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        filters = issue_filters(request.query_params, "GET")
        epics = (
            Issue.objects.filter(workspace__slug=slug, project_id=project_id)
            .filter(Q(type__isnull=False) & Q(type__is_epic=True))
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .annotate(
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
        )
        epics = epics.filter(**filters)
        order_by_param = request.GET.get("order_by", "-created_at")
        # Issue queryset
        epics, order_by_param = order_issue_queryset(
            issue_queryset=epics, order_by_param=order_by_param
        )
        return self.paginate(
            request=request,
            order_by=order_by_param,
            queryset=(epics),
            on_results=lambda epics: EpicSerializer(
                epics, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class WorkspaceEpicEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.EPICS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        initiative_id = request.query_params.get("initiative_id", None)

        epics_query = Issue.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__project_projectfeature__is_epic_enabled=True,
        ).filter(
            Q(type__isnull=False)
            & Q(type__is_epic=True)
            & Q(project__deleted_at__isnull=True)
        )

        if initiative_id:
            # Exclude epics that are already in the initiative
            initiative_epics = (
                InitiativeEpic.objects.filter(initiative_id=initiative_id)
                .filter(epic__project__deleted_at__isnull=True)
                .values_list("epic_id", flat=True)
            )

            epics_query = epics_query.exclude(id__in=initiative_epics)

        epics = (
            epics_query.select_related("workspace", "project", "state", "type")
            .annotate(state_group=F("state__group"))
            .values(
                "id",
                "name",
                "state_id",
                "sequence_id",
                "project_id",
                "state__group",
                "type_id",
                "project__identifier",
            )
        )

        return Response(epics, status=status.HTTP_200_OK)


class EpicListAnalyticsEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.EPICS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        epics = (
            Issue.objects.filter(workspace__slug=slug, project_id=project_id)
            .filter(Q(type__isnull=False) & Q(type__is_epic=True))
            .values_list("id", flat=True)
        )

        # fetch all the issues in which user is part of
        issues = Issue.objects.filter(workspace__slug=slug, project_id=project_id)

        result = []
        for epic_id in epics:
            # get all the issues of the particular epic
            issue_ids = get_all_related_issues(epic_id)

            completed_issues = (
                issues.filter(
                    id__in=issue_ids, project_id=project_id, workspace__slug=slug
                )
                .filter(state__group="completed")
                .count()
            )

            cancelled_issues = (
                issues.filter(
                    id__in=issue_ids, project_id=project_id, workspace__slug=slug
                )
                .filter(state__group="cancelled")
                .count()
            )

            total_issues = issues.filter(
                id__in=issue_ids, project_id=project_id, workspace__slug=slug
            ).count()

            result.append(
                {
                    "epic_id": epic_id,
                    "total_issues": total_issues,
                    "completed_issues": completed_issues,
                    "cancelled_issues": cancelled_issues,
                }
            )

        return Response(result, status=status.HTTP_200_OK)


class EpicMetaEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, epic_id):
        epic = Issue.objects.only("sequence_id", "project__identifier").get(
            id=epic_id, project_id=project_id, workspace__slug=slug, type__is_epic=True
        )
        return Response(
            {
                "sequence_id": epic.sequence_id,
                "project_identifier": epic.project.identifier,
            },
            status=status.HTTP_200_OK,
        )


class EpicDetailIdentifierEndpoint(BaseAPIView):
    def strict_str_to_int(self, s):
        if not s.isdigit() and not (s.startswith("-") and s[1:].isdigit()):
            raise ValueError("Invalid integer string")
        return int(s)

    def get_queryset(self):
        return (
            Issue.objects.filter(Q(type__isnull=False) & Q(type__is_epic=True))
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

    def get(self, request, slug, project_identifier, epic_identifier):
        # Check if the issue identifier is a valid integer
        try:
            epic_identifier = self.strict_str_to_int(epic_identifier)
        except ValueError:
            return Response(
                {"error": "Invalid issue identifier"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch the project
        project = Project.objects.get(
            identifier__iexact=project_identifier, workspace__slug=slug
        )

        print()

        # Fetch the issue
        issue = (
            self.get_queryset()
            .filter(sequence_id=epic_identifier, project_id=project.id)
            .first()
        )

        # Check if the issue exists
        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if the user is a member of the project
        if not ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project.id,
            member=request.user,
            is_active=True,
        ).exists():
            return Response(
                {
                    "error": "You are not allowed to view this issue",
                    "type": project.network,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Serialize the issue
        serializer = EpicDetailSerializer(issue, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EpicDescriptionVersionEndpoint(BaseAPIView):
    def process_paginated_result(self, fields, results, timezone):
        paginated_data = results.values(*fields)

        datetime_fields = ["created_at", "updated_at"]
        paginated_data = user_timezone_converter(
            paginated_data, datetime_fields, timezone
        )

        return paginated_data

    @check_feature_flag(FeatureFlag.EPICS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, epic_id, pk=None):
        project = Project.objects.get(pk=project_id)
        issue = Issue.objects.get(
            workspace__slug=slug, project_id=project_id, pk=epic_id
        )

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.GUEST.value,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not issue.created_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if pk:
            issue_description_version = IssueDescriptionVersion.objects.get(
                workspace__slug=slug, project_id=project_id, issue_id=epic_id, pk=pk
            )

            serializer = IssueDescriptionVersionDetailSerializer(
                issue_description_version
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        cursor = request.GET.get("cursor", None)

        required_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "last_saved_at",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

        issue_description_versions_queryset = IssueDescriptionVersion.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=epic_id
        ).order_by("-created_at")
        paginated_data = paginate(
            base_queryset=issue_description_versions_queryset,
            queryset=issue_description_versions_queryset,
            cursor=cursor,
            on_result=lambda results: self.process_paginated_result(
                required_fields, results, request.user.user_timezone
            ),
        )
        return Response(paginated_data, status=status.HTTP_200_OK)
