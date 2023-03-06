# Python imports
import json

# Django imports
from django.db.models import OuterRef, Func, F, Q
from django.core import serializers
from django.utils import timezone

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import CycleSerializer, CycleIssueSerializer
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import Cycle, CycleIssue, Issue
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.grouper import group_results


class CycleViewSet(BaseViewSet):
    serializer_class = CycleSerializer
    model = Cycle
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"), owned_by=self.request.user
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .distinct()
        )

    def create(self, request, slug, project_id):
        try:
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
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(
                    {
                        "error": "Both start date and end date are either required or are to be null"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CycleIssueViewSet(BaseViewSet):
    serializer_class = CycleIssueSerializer
    model = CycleIssue

    permission_classes = [
        ProjectEntityPermission,
    ]

    filterset_fields = [
        "issue__labels__id",
        "issue__assignees__id",
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            cycle_id=self.kwargs.get("cycle_id"),
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .annotate(
                sub_issues_count=Issue.objects.filter(parent=OuterRef("issue_id"))
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
            .distinct()
        )

    def list(self, request, slug, project_id, cycle_id):
        try:
            order_by = request.GET.get("order_by", "created_at")
            queryset = self.get_queryset().order_by(f"issue__{order_by}")
            group_by = request.GET.get("group_by", False)

            cycle_issues = CycleIssueSerializer(queryset, many=True).data

            if group_by:
                return Response(
                    group_results(cycle_issues, f"issue_detail.{group_by}"),
                    status=status.HTTP_200_OK,
                )

            return Response(
                cycle_issues,
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def create(self, request, slug, project_id, cycle_id):
        try:
            issues = request.data.get("issues", [])

            if not len(issues):
                return Response(
                    {"error": "Issues are required"}, status=status.HTTP_400_BAD_REQUEST
                )

            cycle = Cycle.objects.get(
                workspace__slug=slug, project_id=project_id, pk=cycle_id
            )

            # Get all CycleIssues already created
            cycle_issues = list(CycleIssue.objects.filter(issue_id__in=issues))
            records_to_update = []
            update_cycle_issue_activity = []
            record_to_create = []

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
                {
                    "type": "issue.activity",
                    "requested_data": json.dumps({"cycles_list": issues}),
                    "actor_id": str(self.request.user.id),
                    "issue_id": str(self.kwargs.get("pk", None)),
                    "project_id": str(self.kwargs.get("project_id", None)),
                    "current_instance": json.dumps(
                        {
                            "updated_cycle_issues": update_cycle_issue_activity,
                            "created_cycle_issues": serializers.serialize(
                                "json", record_to_create
                            ),
                        }
                    ),
                },
            )

            # Return all Cycle Issues
            return Response(
                CycleIssueSerializer(self.get_queryset(), many=True).data,
                status=status.HTTP_200_OK,
            )

        except Cycle.DoesNotExist:
            return Response(
                {"error": "Cycle not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CycleDateCheckEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):
        try:
            start_date = request.data.get("start_date")
            end_date = request.data.get("end_date")

            cycles = Cycle.objects.filter(
                Q(start_date__lte=start_date, end_date__gte=start_date)
                | Q(start_date__gte=end_date, end_date__lte=end_date),
                workspace__slug=slug,
                project_id=project_id,
            )

            if cycles.exists():
                return Response(
                    {
                        "error": "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
                        "cycles": CycleSerializer(cycles, many=True).data,
                        "status": False,
                    }
                )
            else:
                return Response({"status": True}, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CurrentUpcomingCyclesEndpoint(BaseAPIView):
    def get(self, request, slug, project_id):
        try:
            current_cycle = Cycle.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
            )

            upcoming_cycle = Cycle.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                start_date__gt=timezone.now(),
            )

            return Response(
                {
                    "current_cycle": CycleSerializer(current_cycle, many=True).data,
                    "upcoming_cycle": CycleSerializer(upcoming_cycle, many=True).data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CompletedCyclesEndpoint(BaseAPIView):
    def get(self, request, slug, project_id):
        try:
            completed_cycles = Cycle.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                end_date__lt=timezone.now(),
            )

            return Response(
                {
                    "completed_cycles": CycleSerializer(
                        completed_cycles, many=True
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class DraftCyclesEndpoint(BaseAPIView):
    def get(self, request, slug, project_id):
        try:
            draft_cycles = Cycle.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                end_date=None,
                start_date=None,
            )

            return Response(
                {"draft_cycles": CycleSerializer(draft_cycles, many=True).data},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
