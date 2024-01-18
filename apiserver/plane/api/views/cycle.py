# Python imports
import json

# Django imports
from django.db.models import Q, Count, Sum, Prefetch, F, OuterRef, Func
from django.utils import timezone
from django.core import serializers

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseAPIView, WebhookMixin
from plane.db.models import (
    Cycle,
    Issue,
    CycleIssue,
    IssueLink,
    IssueAttachment,
)
from plane.app.permissions import ProjectEntityPermission
from plane.api.serializers import (
    CycleSerializer,
    CycleIssueSerializer,
)
from plane.bgtasks.issue_activites_task import issue_activity


class CycleAPIEndpoint(WebhookMixin, BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to cycle.

    """

    serializer_class = CycleSerializer
    model = Cycle
    webhook_event = "cycle"
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_queryset(self):
        return (
            Cycle.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(
                total_issues=Count(
                    "issue_cycle",
                    filter=Q(
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
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
                    ),
                )
            )
            .annotate(
                total_estimates=Sum("issue_cycle__issue__estimate_point")
            )
            .annotate(
                completed_estimates=Sum(
                    "issue_cycle__issue__estimate_point",
                    filter=Q(
                        issue_cycle__issue__state__group="completed",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
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
                    ),
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id, pk=None):
        if pk:
            queryset = self.get_queryset().get(pk=pk)
            data = CycleSerializer(
                queryset,
                fields=self.fields,
                expand=self.expand,
            ).data
            return Response(
                data,
                status=status.HTTP_200_OK,
            )
        queryset = self.get_queryset()
        cycle_view = request.GET.get("cycle_view", "all")

        # Current Cycle
        if cycle_view == "current":
            queryset = queryset.filter(
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
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
                    cycles,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
            )

        # Completed Cycles
        if cycle_view == "completed":
            queryset = queryset.filter(end_date__lt=timezone.now())
            return self.paginate(
                request=request,
                queryset=(queryset),
                on_results=lambda cycles: CycleSerializer(
                    cycles,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
            )

        # Draft Cycles
        if cycle_view == "draft":
            queryset = queryset.filter(
                end_date=None,
                start_date=None,
            )
            return self.paginate(
                request=request,
                queryset=(queryset),
                on_results=lambda cycles: CycleSerializer(
                    cycles,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
            )

        # Incomplete Cycles
        if cycle_view == "incomplete":
            queryset = queryset.filter(
                Q(end_date__gte=timezone.now().date())
                | Q(end_date__isnull=True),
            )
            return self.paginate(
                request=request,
                queryset=(queryset),
                on_results=lambda cycles: CycleSerializer(
                    cycles,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
            )
        return self.paginate(
            request=request,
            queryset=(queryset),
            on_results=lambda cycles: CycleSerializer(
                cycles,
                many=True,
                fields=self.fields,
                expand=self.expand,
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
                serializer.save(
                    project_id=project_id,
                    owned_by=request.user,
                )
                return Response(
                    serializer.data, status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
        else:
            return Response(
                {
                    "error": "Both start date and end date are either required or are to be null"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def patch(self, request, slug, project_id, pk):
        cycle = Cycle.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )

        request_data = request.data

        if (
            cycle.end_date is not None
            and cycle.end_date < timezone.now().date()
        ):
            if "sort_order" in request_data:
                # Can only change sort order
                request_data = {
                    "sort_order": request_data.get(
                        "sort_order", cycle.sort_order
                    )
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
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, pk):
        cycle_issues = list(
            CycleIssue.objects.filter(
                cycle_id=self.kwargs.get("pk")
            ).values_list("issue", flat=True)
        )
        cycle = Cycle.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
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
        return Response(status=status.HTTP_204_NO_CONTENT)


class CycleIssueAPIEndpoint(WebhookMixin, BaseAPIView):
    """
    This viewset automatically provides `list`, `create`,
    and `destroy` actions related to cycle issues.

    """

    serializer_class = CycleIssueSerializer
    model = CycleIssue
    webhook_event = "cycle_issue"
    bulk = True
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_queryset(self):
        return (
            CycleIssue.objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("issue_id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .filter(cycle_id=self.kwargs.get("cycle_id"))
            .select_related("project")
            .select_related("workspace")
            .select_related("cycle")
            .select_related("issue", "issue__state", "issue__project")
            .prefetch_related("issue__assignees", "issue__labels")
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id, cycle_id):
        order_by = request.GET.get("order_by", "created_at")
        issues = (
            Issue.issue_objects.filter(issue_cycle__cycle_id=cycle_id)
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
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
                attachment_count=IssueAttachment.objects.filter(
                    issue=OuterRef("id")
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
                issues,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )

    def post(self, request, slug, project_id, cycle_id):
        issues = request.data.get("issues", [])

        if not issues:
            return Response(
                {"error": "Issues are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle = Cycle.objects.get(
            workspace__slug=slug, project_id=project_id, pk=cycle_id
        )

        if (
            cycle.end_date is not None
            and cycle.end_date < timezone.now().date()
        ):
            return Response(
                {
                    "error": "The Cycle has already been completed so no new issues can be added"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        issues = Issue.objects.filter(
            pk__in=issues, workspace__slug=slug, project_id=project_id
        ).values_list("id", flat=True)

        # Get all CycleIssues already created
        cycle_issues = list(CycleIssue.objects.filter(issue_id__in=issues))
        update_cycle_issue_activity = []
        record_to_create = []
        records_to_update = []

        for issue in issues:
            cycle_issue = [
                cycle_issue
                for cycle_issue in cycle_issues
                if str(cycle_issue.issue_id) in issues
            ]
            # Update only when cycle changes
            if len(cycle_issue):
                if cycle_issue[0].cycle_id != cycle_id:
                    update_cycle_issue_activity.append(
                        {
                            "old_cycle_id": str(cycle_issue[0].cycle_id),
                            "new_cycle_id": str(cycle_id),
                            "issue_id": str(cycle_issue[0].issue_id),
                        }
                    )
                    cycle_issue[0].cycle_id = cycle_id
                    records_to_update.append(cycle_issue[0])
            else:
                record_to_create.append(
                    CycleIssue(
                        project_id=project_id,
                        workspace=cycle.workspace,
                        created_by=request.user,
                        updated_by=request.user,
                        cycle=cycle,
                        issue_id=issue,
                    )
                )

        CycleIssue.objects.bulk_create(
            record_to_create,
            batch_size=10,
            ignore_conflicts=True,
        )
        CycleIssue.objects.bulk_update(
            records_to_update,
            ["cycle"],
            batch_size=10,
        )

        # Capture Issue Activity
        issue_activity.delay(
            type="cycle.activity.created",
            requested_data=json.dumps({"cycles_list": str(issues)}),
            actor_id=str(self.request.user.id),
            issue_id=None,
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=json.dumps(
                {
                    "updated_cycle_issues": update_cycle_issue_activity,
                    "created_cycle_issues": serializers.serialize(
                        "json", record_to_create
                    ),
                }
            ),
            epoch=int(timezone.now().timestamp()),
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
    This viewset provides `create` actions for transfering the issues into a particular cycle.

    """

    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id, cycle_id):
        new_cycle_id = request.data.get("new_cycle_id", False)

        if not new_cycle_id:
            return Response(
                {"error": "New Cycle Id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_cycle = Cycle.objects.get(
            workspace__slug=slug, project_id=project_id, pk=new_cycle_id
        )

        if (
            new_cycle.end_date is not None
            and new_cycle.end_date < timezone.now().date()
        ):
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
        for cycle_issue in cycle_issues:
            cycle_issue.cycle_id = new_cycle_id
            updated_cycles.append(cycle_issue)

        cycle_issues = CycleIssue.objects.bulk_update(
            updated_cycles, ["cycle_id"], batch_size=100
        )

        return Response({"message": "Success"}, status=status.HTTP_200_OK)
