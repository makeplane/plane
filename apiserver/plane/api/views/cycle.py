# Python imports
import json

# Django imports
from django.core import serializers
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import (
    Count,
    F,
    Func,
    OuterRef,
    Q,
    Sum,
    FloatField,
    Case,
    When,
    Value,
)
from django.db.models.functions import Cast, Concat
from django.db import models

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import CycleIssueSerializer, CycleSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    Project,
    FileAsset,
    IssueLink,
    ProjectMember,
    UserFavorite,
)
from plane.utils.analytics_plot import burndown_plot

from .base import BaseAPIView
from plane.bgtasks.webhook_task import model_activity


class CycleAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to cycle.

    """

    serializer_class = CycleSerializer
    model = Cycle
    webhook_event = "cycle"
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return (
            Cycle.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(
                total_issues=Count(
                    "issue_cycle",
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="completed",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="cancelled",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="started",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="unstarted",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="backlog",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id, pk=None):
        if pk:
            queryset = self.get_queryset().filter(archived_at__isnull=True).get(pk=pk)
            data = CycleSerializer(
                queryset, fields=self.fields, expand=self.expand
            ).data
            return Response(data, status=status.HTTP_200_OK)
        queryset = self.get_queryset().filter(archived_at__isnull=True)
        cycle_view = request.GET.get("cycle_view", "all")

        # Current Cycle
        if cycle_view == "current":
            queryset = queryset.filter(
                start_date__lte=timezone.now(), end_date__gte=timezone.now()
            )
            data = CycleSerializer(
                queryset, many=True, fields=self.fields, expand=self.expand
            ).data
            return Response(data, status=status.HTTP_200_OK)

        # Upcoming Cycles
        if cycle_view == "upcoming":
            queryset = queryset.filter(start_date__gt=timezone.now())
            return self.paginate(
                request=request,
                queryset=(queryset),
                on_results=lambda cycles: CycleSerializer(
                    cycles, many=True, fields=self.fields, expand=self.expand
                ).data,
            )

        # Completed Cycles
        if cycle_view == "completed":
            queryset = queryset.filter(end_date__lt=timezone.now())
            return self.paginate(
                request=request,
                queryset=(queryset),
                on_results=lambda cycles: CycleSerializer(
                    cycles, many=True, fields=self.fields, expand=self.expand
                ).data,
            )

        # Draft Cycles
        if cycle_view == "draft":
            queryset = queryset.filter(end_date=None, start_date=None)
            return self.paginate(
                request=request,
                queryset=(queryset),
                on_results=lambda cycles: CycleSerializer(
                    cycles, many=True, fields=self.fields, expand=self.expand
                ).data,
            )

        # Incomplete Cycles
        if cycle_view == "incomplete":
            queryset = queryset.filter(
                Q(end_date__gte=timezone.now()) | Q(end_date__isnull=True)
            )
            return self.paginate(
                request=request,
                queryset=(queryset),
                on_results=lambda cycles: CycleSerializer(
                    cycles, many=True, fields=self.fields, expand=self.expand
                ).data,
            )
        return self.paginate(
            request=request,
            queryset=(queryset),
            on_results=lambda cycles: CycleSerializer(
                cycles, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    def post(self, request, slug, project_id):
        if (
            request.data.get("start_date", None) is None
            and request.data.get("end_date", None) is None
        ) or (
            request.data.get("start_date", None) is not None
            and request.data.get("end_date", None) is not None
        ):
            serializer = CycleSerializer(data=request.data)
            if serializer.is_valid():
                if (
                    request.data.get("external_id")
                    and request.data.get("external_source")
                    and Cycle.objects.filter(
                        project_id=project_id,
                        workspace__slug=slug,
                        external_source=request.data.get("external_source"),
                        external_id=request.data.get("external_id"),
                    ).exists()
                ):
                    cycle = Cycle.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        external_source=request.data.get("external_source"),
                        external_id=request.data.get("external_id"),
                    ).first()
                    return Response(
                        {
                            "error": "Cycle with the same external id and external source already exists",
                            "id": str(cycle.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                serializer.save(project_id=project_id, owned_by=request.user)
                # Send the model activity
                model_activity.delay(
                    model_name="cycle",
                    model_id=str(serializer.data["id"]),
                    requested_data=request.data,
                    current_instance=None,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=request.META.get("HTTP_ORIGIN"),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                {
                    "error": "Both start date and end date are either required or are to be null"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def patch(self, request, slug, project_id, pk):
        cycle = Cycle.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)

        current_instance = json.dumps(
            CycleSerializer(cycle).data, cls=DjangoJSONEncoder
        )

        if cycle.archived_at:
            return Response(
                {"error": "Archived cycle cannot be edited"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request_data = request.data

        if cycle.end_date is not None and cycle.end_date < timezone.now():
            if "sort_order" in request_data:
                # Can only change sort order
                request_data = {
                    "sort_order": request_data.get("sort_order", cycle.sort_order)
                }
            else:
                return Response(
                    {
                        "error": "The Cycle has already been completed so it cannot be edited"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = CycleSerializer(cycle, data=request.data, partial=True)
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and (cycle.external_id != request.data.get("external_id"))
                and Cycle.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get(
                        "external_source", cycle.external_source
                    ),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Cycle with the same external id and external source already exists",
                        "id": str(cycle.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save()

            # Send the model activity
            model_activity.delay(
                model_name="cycle",
                model_id=str(serializer.data["id"]),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, pk):
        cycle = Cycle.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        if cycle.owned_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=20,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or creator can delete the cycle"},
                status=status.HTTP_403_FORBIDDEN,
            )

        cycle_issues = list(
            CycleIssue.objects.filter(cycle_id=self.kwargs.get("pk")).values_list(
                "issue", flat=True
            )
        )

        issue_activity.delay(
            type="cycle.activity.deleted",
            requested_data=json.dumps(
                {
                    "cycle_id": str(pk),
                    "cycle_name": str(cycle.name),
                    "issues": [str(issue_id) for issue_id in cycle_issues],
                }
            ),
            actor_id=str(request.user.id),
            issue_id=None,
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
        )
        # Delete the cycle
        cycle.delete()
        # Delete the user favorite cycle
        UserFavorite.objects.filter(
            entity_type="cycle", entity_identifier=pk, project_id=project_id
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CycleArchiveUnarchiveAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return (
            Cycle.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(archived_at__isnull=False)
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(
                total_issues=Count(
                    "issue_cycle",
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="completed",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="cancelled",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="started",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="unstarted",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="backlog",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(total_estimates=Sum("issue_cycle__issue__estimate_point"))
            .annotate(
                completed_estimates=Sum(
                    "issue_cycle__issue__estimate_point",
                    filter=Q(
                        issue_cycle__issue__state__group="completed",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                started_estimates=Sum(
                    "issue_cycle__issue__estimate_point",
                    filter=Q(
                        issue_cycle__issue__state__group="started",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id):
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda cycles: CycleSerializer(
                cycles, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    def post(self, request, slug, project_id, cycle_id):
        cycle = Cycle.objects.get(
            pk=cycle_id, project_id=project_id, workspace__slug=slug
        )
        if cycle.end_date >= timezone.now():
            return Response(
                {"error": "Only completed cycles can be archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cycle.archived_at = timezone.now()
        cycle.save()
        UserFavorite.objects.filter(
            entity_type="cycle",
            entity_identifier=cycle_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, slug, project_id, cycle_id):
        cycle = Cycle.objects.get(
            pk=cycle_id, project_id=project_id, workspace__slug=slug
        )
        cycle.archived_at = None
        cycle.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CycleIssueAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`,
    and `destroy` actions related to cycle issues.

    """

    serializer_class = CycleIssueSerializer
    model = CycleIssue
    webhook_event = "cycle_issue"
    bulk = True
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return (
            CycleIssue.objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("issue_id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(cycle_id=self.kwargs.get("cycle_id"))
            .select_related("project")
            .select_related("workspace")
            .select_related("cycle")
            .select_related("issue", "issue__state", "issue__project")
            .prefetch_related("issue__assignees", "issue__labels")
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id, cycle_id, issue_id=None):
        # Get
        if issue_id:
            cycle_issue = CycleIssue.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                cycle_id=cycle_id,
                issue_id=issue_id,
            )
            serializer = CycleIssueSerializer(
                cycle_issue, fields=self.fields, expand=self.expand
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        # List
        order_by = request.GET.get("order_by", "created_at")
        issues = (
            Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id, issue_cycle__deleted_at__isnull=True
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(bridge_id=F("issue_cycle__id"))
            .filter(project_id=project_id)
            .filter(workspace__slug=slug)
            .select_related("project")
            .select_related("workspace")
            .select_related("state")
            .select_related("parent")
            .prefetch_related("assignees")
            .prefetch_related("labels")
            .order_by(order_by)
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
        )

        return self.paginate(
            request=request,
            queryset=(issues),
            on_results=lambda issues: CycleSerializer(
                issues, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    def post(self, request, slug, project_id, cycle_id):
        issues = request.data.get("issues", [])

        if not issues:
            return Response(
                {"error": "Issues are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        cycle = Cycle.objects.get(
            workspace__slug=slug, project_id=project_id, pk=cycle_id
        )

        # Get all CycleIssues already created
        cycle_issues = list(
            CycleIssue.objects.filter(~Q(cycle_id=cycle_id), issue_id__in=issues)
        )

        existing_issues = [
            str(cycle_issue.issue_id)
            for cycle_issue in cycle_issues
            if str(cycle_issue.issue_id) in issues
        ]
        new_issues = list(set(issues) - set(existing_issues))

        # New issues to create
        created_records = CycleIssue.objects.bulk_create(
            [
                CycleIssue(
                    project_id=project_id,
                    workspace_id=cycle.workspace_id,
                    cycle_id=cycle_id,
                    issue_id=issue,
                )
                for issue in new_issues
            ],
            ignore_conflicts=True,
            batch_size=10,
        )

        # Updated Issues
        updated_records = []
        update_cycle_issue_activity = []
        # Iterate over each cycle_issue in cycle_issues
        for cycle_issue in cycle_issues:
            old_cycle_id = cycle_issue.cycle_id
            # Update the cycle_issue's cycle_id
            cycle_issue.cycle_id = cycle_id
            # Add the modified cycle_issue to the records_to_update list
            updated_records.append(cycle_issue)
            # Record the update activity
            update_cycle_issue_activity.append(
                {
                    "old_cycle_id": str(old_cycle_id),
                    "new_cycle_id": str(cycle_id),
                    "issue_id": str(cycle_issue.issue_id),
                }
            )

        # Update the cycle issues
        CycleIssue.objects.bulk_update(updated_records, ["cycle_id"], batch_size=100)

        # Capture Issue Activity
        issue_activity.delay(
            type="cycle.activity.created",
            requested_data=json.dumps({"cycles_list": issues}),
            actor_id=str(self.request.user.id),
            issue_id=None,
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=json.dumps(
                {
                    "updated_cycle_issues": update_cycle_issue_activity,
                    "created_cycle_issues": serializers.serialize(
                        "json", created_records
                    ),
                }
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        # Return all Cycle Issues
        return Response(
            CycleIssueSerializer(self.get_queryset(), many=True).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug, project_id, cycle_id, issue_id):
        cycle_issue = CycleIssue.objects.get(
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            cycle_id=cycle_id,
        )
        issue_id = cycle_issue.issue_id
        cycle_issue.delete()
        issue_activity.delay(
            type="cycle.activity.deleted",
            requested_data=json.dumps(
                {
                    "cycle_id": str(self.kwargs.get("cycle_id")),
                    "issues": [str(issue_id)],
                }
            ),
            actor_id=str(self.request.user.id),
            issue_id=str(issue_id),
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TransferCycleIssueAPIEndpoint(BaseAPIView):
    """
    This viewset provides `create` actions for transferring the issues into a particular cycle.

    """

    permission_classes = [ProjectEntityPermission]

    def post(self, request, slug, project_id, cycle_id):
        new_cycle_id = request.data.get("new_cycle_id", False)

        if not new_cycle_id:
            return Response(
                {"error": "New Cycle Id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_cycle = Cycle.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=new_cycle_id
        ).first()

        old_cycle = (
            Cycle.objects.filter(
                workspace__slug=slug, project_id=project_id, pk=cycle_id
            )
            .annotate(
                total_issues=Count(
                    "issue_cycle",
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="completed",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="cancelled",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="started",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="unstarted",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="backlog",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
        )

        estimate_type = Project.objects.filter(
            workspace__slug=slug,
            pk=project_id,
            estimate__isnull=False,
            estimate__type="points",
        ).exists()

        if estimate_type:
            assignee_estimate_data = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
                    issue_cycle__deleted_at__isnull=True,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(display_name=F("assignees__display_name"))
                .annotate(assignee_id=F("assignees__id"))
                .annotate(avatar=F("assignees__avatar"))
                .annotate(
                    avatar_url=Case(
                        # If `avatar_asset` exists, use it to generate the asset URL
                        When(
                            assignees__avatar_asset__isnull=False,
                            then=Concat(
                                Value("/api/assets/v2/static/"),
                                "assignees__avatar_asset",  # Assuming avatar_asset has an id or relevant field
                                Value("/"),
                            ),
                        ),
                        # If `avatar_asset` is None, fall back to using `avatar` field directly
                        When(
                            assignees__avatar_asset__isnull=True,
                            then="assignees__avatar",
                        ),
                        default=Value(None),
                        output_field=models.CharField(),
                    )
                )
                .values("display_name", "assignee_id", "avatar", "avatar_url")
                .annotate(
                    total_estimates=Sum(Cast("estimate_point__value", FloatField()))
                )
                .annotate(
                    completed_estimates=Sum(
                        Cast("estimate_point__value", FloatField()),
                        filter=Q(
                            completed_at__isnull=False,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_estimates=Sum(
                        Cast("estimate_point__value", FloatField()),
                        filter=Q(
                            completed_at__isnull=True,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .order_by("display_name")
            )
            # assignee distribution serialization
            assignee_estimate_distribution = [
                {
                    "display_name": item["display_name"],
                    "assignee_id": (
                        str(item["assignee_id"]) if item["assignee_id"] else None
                    ),
                    "avatar": item.get("avatar", None),
                    "avatar_url": item.get("avatar_url", None),
                    "total_estimates": item["total_estimates"],
                    "completed_estimates": item["completed_estimates"],
                    "pending_estimates": item["pending_estimates"],
                }
                for item in assignee_estimate_data
            ]

            label_distribution_data = (
                Issue.issue_objects.filter(
                    issue_cycle__cycle_id=cycle_id,
                    issue_cycle__deleted_at__isnull=True,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(label_name=F("labels__name"))
                .annotate(color=F("labels__color"))
                .annotate(label_id=F("labels__id"))
                .values("label_name", "color", "label_id")
                .annotate(
                    total_estimates=Sum(Cast("estimate_point__value", FloatField()))
                )
                .annotate(
                    completed_estimates=Sum(
                        Cast("estimate_point__value", FloatField()),
                        filter=Q(
                            completed_at__isnull=False,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_estimates=Sum(
                        Cast("estimate_point__value", FloatField()),
                        filter=Q(
                            completed_at__isnull=True,
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
                )
                .order_by("label_name")
            )

            estimate_completion_chart = burndown_plot(
                queryset=old_cycle.first(),
                slug=slug,
                project_id=project_id,
                plot_type="points",
                cycle_id=cycle_id,
            )
            # Label distribution serialization
            label_estimate_distribution = [
                {
                    "label_name": item["label_name"],
                    "color": item["color"],
                    "label_id": (str(item["label_id"]) if item["label_id"] else None),
                    "total_estimates": item["total_estimates"],
                    "completed_estimates": item["completed_estimates"],
                    "pending_estimates": item["pending_estimates"],
                }
                for item in label_distribution_data
            ]

        # Get the assignee distribution
        assignee_distribution = (
            Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(display_name=F("assignees__display_name"))
            .annotate(assignee_id=F("assignees__id"))
            .annotate(avatar=F("assignees__avatar"))
            .annotate(
                avatar_url=Case(
                    # If `avatar_asset` exists, use it to generate the asset URL
                    When(
                        assignees__avatar_asset__isnull=False,
                        then=Concat(
                            Value("/api/assets/v2/static/"),
                            "assignees__avatar_asset",  # Assuming avatar_asset has an id or relevant field
                            Value("/"),
                        ),
                    ),
                    # If `avatar_asset` is None, fall back to using `avatar` field directly
                    When(
                        assignees__avatar_asset__isnull=True, then="assignees__avatar"
                    ),
                    default=Value(None),
                    output_field=models.CharField(),
                )
            )
            .values("display_name", "assignee_id", "avatar_url")
            .annotate(
                total_issues=Count(
                    "id", filter=Q(archived_at__isnull=True, is_draft=False)
                )
            )
            .annotate(
                completed_issues=Count(
                    "id",
                    filter=Q(
                        completed_at__isnull=False,
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
            )
            .annotate(
                pending_issues=Count(
                    "id",
                    filter=Q(
                        completed_at__isnull=True,
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
            )
            .order_by("display_name")
        )
        # assignee distribution serialized
        assignee_distribution_data = [
            {
                "display_name": item["display_name"],
                "assignee_id": (
                    str(item["assignee_id"]) if item["assignee_id"] else None
                ),
                "avatar": item.get("avatar", None),
                "avatar_url": item.get("avatar_url", None),
                "total_issues": item["total_issues"],
                "completed_issues": item["completed_issues"],
                "pending_issues": item["pending_issues"],
            }
            for item in assignee_distribution
        ]

        # Get the label distribution
        label_distribution = (
            Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(label_name=F("labels__name"))
            .annotate(color=F("labels__color"))
            .annotate(label_id=F("labels__id"))
            .values("label_name", "color", "label_id")
            .annotate(
                total_issues=Count(
                    "id", filter=Q(archived_at__isnull=True, is_draft=False)
                )
            )
            .annotate(
                completed_issues=Count(
                    "id",
                    filter=Q(
                        completed_at__isnull=False,
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
            )
            .annotate(
                pending_issues=Count(
                    "id",
                    filter=Q(
                        completed_at__isnull=True,
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
            )
            .order_by("label_name")
        )

        # Label distribution serilization
        label_distribution_data = [
            {
                "label_name": item["label_name"],
                "color": item["color"],
                "label_id": (str(item["label_id"]) if item["label_id"] else None),
                "total_issues": item["total_issues"],
                "completed_issues": item["completed_issues"],
                "pending_issues": item["pending_issues"],
            }
            for item in label_distribution
        ]

        # Pass the new_cycle queryset to burndown_plot
        completion_chart = burndown_plot(
            queryset=old_cycle.first(),
            slug=slug,
            project_id=project_id,
            plot_type="issues",
            cycle_id=cycle_id,
        )

        current_cycle = Cycle.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=cycle_id
        ).first()

        current_cycle.progress_snapshot = {
            "total_issues": old_cycle.first().total_issues,
            "completed_issues": old_cycle.first().completed_issues,
            "cancelled_issues": old_cycle.first().cancelled_issues,
            "started_issues": old_cycle.first().started_issues,
            "unstarted_issues": old_cycle.first().unstarted_issues,
            "backlog_issues": old_cycle.first().backlog_issues,
            "distribution": {
                "labels": label_distribution_data,
                "assignees": assignee_distribution_data,
                "completion_chart": completion_chart,
            },
            "estimate_distribution": (
                {}
                if not estimate_type
                else {
                    "labels": label_estimate_distribution,
                    "assignees": assignee_estimate_distribution,
                    "completion_chart": estimate_completion_chart,
                }
            ),
        }
        current_cycle.save(update_fields=["progress_snapshot"])

        if new_cycle.end_date is not None and new_cycle.end_date < timezone.now():
            return Response(
                {
                    "error": "The cycle where the issues are transferred is already completed"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle_issues = CycleIssue.objects.filter(
            cycle_id=cycle_id,
            project_id=project_id,
            workspace__slug=slug,
            issue__state__group__in=["backlog", "unstarted", "started"],
        )

        updated_cycles = []
        update_cycle_issue_activity = []
        for cycle_issue in cycle_issues:
            cycle_issue.cycle_id = new_cycle_id
            updated_cycles.append(cycle_issue)
            update_cycle_issue_activity.append(
                {
                    "old_cycle_id": str(cycle_id),
                    "new_cycle_id": str(new_cycle_id),
                    "issue_id": str(cycle_issue.issue_id),
                }
            )

        cycle_issues = CycleIssue.objects.bulk_update(
            updated_cycles, ["cycle_id"], batch_size=100
        )

        # Capture Issue Activity
        issue_activity.delay(
            type="cycle.activity.created",
            requested_data=json.dumps({"cycles_list": []}),
            actor_id=str(self.request.user.id),
            issue_id=None,
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=json.dumps(
                {
                    "updated_cycle_issues": update_cycle_issue_activity,
                    "created_cycle_issues": "[]",
                }
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        return Response({"message": "Success"}, status=status.HTTP_200_OK)
