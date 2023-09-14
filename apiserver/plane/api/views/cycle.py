# Python imports
import json

# Django imports
from django.db import IntegrityError
from django.db.models import (
    OuterRef,
    Func,
    F,
    Q,
    Exists,
    OuterRef,
    Count,
    Prefetch,
    Sum,
)
from django.core import serializers
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    CycleSerializer,
    CycleIssueSerializer,
    CycleFavoriteSerializer,
    IssueStateSerializer,
    CycleWriteSerializer,
)
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import (
    User,
    Cycle,
    CycleIssue,
    Issue,
    CycleFavorite,
    IssueLink,
    IssueAttachment,
    Label,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.grouper import group_results
from plane.utils.issue_filters import issue_filters
from plane.utils.analytics_plot import burndown_plot


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

    def perform_destroy(self, instance):
        cycle_issues = list(
            CycleIssue.objects.filter(cycle_id=self.kwargs.get("pk")).values_list(
                "issue", flat=True
            )
        )
        issue_activity.delay(
            type="cycle.activity.deleted",
            requested_data=json.dumps(
                {
                    "cycle_id": str(self.kwargs.get("pk")),
                    "issues": [str(issue_id) for issue_id in cycle_issues],
                }
            ),
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("pk", None)),
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=None,
        )

        return super().perform_destroy(instance)

    def get_queryset(self):
        subquery = CycleFavorite.objects.filter(
            user=self.request.user,
            cycle_id=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .annotate(total_issues=Count("issue_cycle"))
            .annotate(
                completed_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(issue_cycle__issue__state__group="completed"),
                )
            )
            .annotate(
                cancelled_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(issue_cycle__issue__state__group="cancelled"),
                )
            )
            .annotate(
                started_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(issue_cycle__issue__state__group="started"),
                )
            )
            .annotate(
                unstarted_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(issue_cycle__issue__state__group="unstarted"),
                )
            )
            .annotate(
                backlog_issues=Count(
                    "issue_cycle__issue__state__group",
                    filter=Q(issue_cycle__issue__state__group="backlog"),
                )
            )
            .annotate(total_estimates=Sum("issue_cycle__issue__estimate_point"))
            .annotate(
                completed_estimates=Sum(
                    "issue_cycle__issue__estimate_point",
                    filter=Q(issue_cycle__issue__state__group="completed"),
                )
            )
            .annotate(
                started_estimates=Sum(
                    "issue_cycle__issue__estimate_point",
                    filter=Q(issue_cycle__issue__state__group="started"),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_cycle__issue__assignees",
                    queryset=User.objects.only("avatar", "first_name", "id").distinct(),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_cycle__issue__labels",
                    queryset=Label.objects.only("name", "color", "id").distinct(),
                )
            )
            .order_by("-is_favorite", "name")
            .distinct()
        )

    def list(self, request, slug, project_id):
        try:
            queryset = self.get_queryset()
            cycle_view = request.GET.get("cycle_view", "all")
            order_by = request.GET.get("order_by", "sort_order")

            queryset = queryset.order_by(order_by)

            # All Cycles
            if cycle_view == "all":
                return Response(
                    CycleSerializer(queryset, many=True).data, status=status.HTTP_200_OK
                )

            # Current Cycle
            if cycle_view == "current":
                queryset = queryset.filter(
                    start_date__lte=timezone.now(),
                    end_date__gte=timezone.now(),
                )

                data = CycleSerializer(queryset, many=True).data

                if len(data):
                    assignee_distribution = (
                        Issue.objects.filter(
                            issue_cycle__cycle_id=data[0]["id"],
                            workspace__slug=slug,
                            project_id=project_id,
                        )
                        .annotate(display_name=F("assignees__display_name"))
                        .annotate(assignee_id=F("assignees__id"))
                        .annotate(avatar=F("assignees__avatar"))
                        .values("display_name", "assignee_id", "avatar")
                        .annotate(total_issues=Count("assignee_id"))
                        .annotate(
                            completed_issues=Count(
                                "assignee_id",
                                filter=Q(completed_at__isnull=False),
                            )
                        )
                        .annotate(
                            pending_issues=Count(
                                "assignee_id",
                                filter=Q(completed_at__isnull=True),
                            )
                        )
                        .order_by("display_name")
                    )

                    label_distribution = (
                        Issue.objects.filter(
                            issue_cycle__cycle_id=data[0]["id"],
                            workspace__slug=slug,
                            project_id=project_id,
                        )
                        .annotate(label_name=F("labels__name"))
                        .annotate(color=F("labels__color"))
                        .annotate(label_id=F("labels__id"))
                        .values("label_name", "color", "label_id")
                        .annotate(total_issues=Count("label_id"))
                        .annotate(
                            completed_issues=Count(
                                "label_id",
                                filter=Q(completed_at__isnull=False),
                            )
                        )
                        .annotate(
                            pending_issues=Count(
                                "label_id",
                                filter=Q(completed_at__isnull=True),
                            )
                        )
                        .order_by("label_name")
                    )
                    data[0]["distribution"] = {
                        "assignees": assignee_distribution,
                        "labels": label_distribution,
                        "completion_chart": {},
                    }
                    if data[0]["start_date"] and data[0]["end_date"]:
                        data[0]["distribution"]["completion_chart"] = burndown_plot(
                            queryset=queryset.first(),
                            slug=slug,
                            project_id=project_id,
                            cycle_id=data[0]["id"],
                        )

                return Response(data, status=status.HTTP_200_OK)

            # Upcoming Cycles
            if cycle_view == "upcoming":
                queryset = queryset.filter(start_date__gt=timezone.now())
                return Response(
                    CycleSerializer(queryset, many=True).data, status=status.HTTP_200_OK
                )

            # Completed Cycles
            if cycle_view == "completed":
                queryset = queryset.filter(end_date__lt=timezone.now())
                return Response(
                    CycleSerializer(queryset, many=True).data, status=status.HTTP_200_OK
                )

            # Draft Cycles
            if cycle_view == "draft":
                queryset = queryset.filter(
                    end_date=None,
                    start_date=None,
                )

                return Response(
                    CycleSerializer(queryset, many=True).data, status=status.HTTP_200_OK
                )

            # Incomplete Cycles
            if cycle_view == "incomplete":
                queryset = queryset.filter(
                    Q(end_date__gte=timezone.now().date()) | Q(end_date__isnull=True),
                )
                return Response(
                    CycleSerializer(queryset, many=True).data, status=status.HTTP_200_OK
                )

            return Response(
                {"error": "No matching view found"}, status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
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

    def partial_update(self, request, slug, project_id, pk):
        try:
            cycle = Cycle.objects.get(
                workspace__slug=slug, project_id=project_id, pk=pk
            )

            request_data = request.data

            if cycle.end_date is not None and cycle.end_date < timezone.now().date():
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

            serializer = CycleWriteSerializer(cycle, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Cycle.DoesNotExist:
            return Response(
                {"error": "Cycle does not exist"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def retrieve(self, request, slug, project_id, pk):
        try:
            queryset = self.get_queryset().get(pk=pk)

            # Assignee Distribution
            assignee_distribution = (
                Issue.objects.filter(
                    issue_cycle__cycle_id=pk,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(first_name=F("assignees__first_name"))
                .annotate(last_name=F("assignees__last_name"))
                .annotate(assignee_id=F("assignees__id"))
                .annotate(avatar=F("assignees__avatar"))
                .annotate(display_name=F("assignees__display_name"))
                .values(
                    "first_name", "last_name", "assignee_id", "avatar", "display_name"
                )
                .annotate(total_issues=Count("assignee_id"))
                .annotate(
                    completed_issues=Count(
                        "assignee_id",
                        filter=Q(completed_at__isnull=False),
                    )
                )
                .annotate(
                    pending_issues=Count(
                        "assignee_id",
                        filter=Q(completed_at__isnull=True),
                    )
                )
                .order_by("first_name", "last_name")
            )

            # Label Distribution
            label_distribution = (
                Issue.objects.filter(
                    issue_cycle__cycle_id=pk,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(label_name=F("labels__name"))
                .annotate(color=F("labels__color"))
                .annotate(label_id=F("labels__id"))
                .values("label_name", "color", "label_id")
                .annotate(total_issues=Count("label_id"))
                .annotate(
                    completed_issues=Count(
                        "label_id",
                        filter=Q(completed_at__isnull=False),
                    )
                )
                .annotate(
                    pending_issues=Count(
                        "label_id",
                        filter=Q(completed_at__isnull=True),
                    )
                )
                .order_by("label_name")
            )

            data = CycleSerializer(queryset).data
            data["distribution"] = {
                "assignees": assignee_distribution,
                "labels": label_distribution,
                "completion_chart": {},
            }

            if queryset.start_date and queryset.end_date:
                data["distribution"]["completion_chart"] = burndown_plot(
                    queryset=queryset, slug=slug, project_id=project_id, cycle_id=pk
                )

            return Response(
                data,
                status=status.HTTP_200_OK,
            )
        except Cycle.DoesNotExist:
            return Response(
                {"error": "Cycle Does not exists"}, status=status.HTTP_400_BAD_REQUEST
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

    def perform_destroy(self, instance):
        issue_activity.delay(
            type="cycle.activity.deleted",
            requested_data=json.dumps(
                {
                    "cycle_id": str(self.kwargs.get("cycle_id")),
                    "issues": [str(instance.issue_id)],
                }
            ),
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("pk", None)),
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=None,
        )
        return super().perform_destroy(instance)

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("issue_id"))
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

    @method_decorator(gzip_page)
    def list(self, request, slug, project_id, cycle_id):
        try:
            order_by = request.GET.get("order_by", "created_at")
            group_by = request.GET.get("group_by", False)
            sub_group_by = request.GET.get("sub_group_by", False)
            filters = issue_filters(request.query_params, "GET")
            issues = (
                Issue.issue_objects.filter(issue_cycle__cycle_id=cycle_id)
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
                .filter(**filters)
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

            issues_data = IssueStateSerializer(issues, many=True).data

            if sub_group_by and sub_group_by == group_by:
                return Response(
                    {"error": "Group by and sub group by cannot be same"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if group_by:
                return Response(
                    group_results(issues_data, group_by, sub_group_by),
                    status=status.HTTP_200_OK,
                )

            return Response(
                issues_data,
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

            if cycle.end_date is not None and cycle.end_date < timezone.now().date():
                return Response(
                    {
                        "error": "The Cycle has already been completed so no new issues can be added"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

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
                requested_data=json.dumps({"cycles_list": issues}),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("pk", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    {
                        "updated_cycle_issues": update_cycle_issue_activity,
                        "created_cycle_issues": serializers.serialize(
                            "json", record_to_create
                        ),
                    }
                ),
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
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id):
        try:
            start_date = request.data.get("start_date", False)
            end_date = request.data.get("end_date", False)
            cycle_id = request.data.get("cycle_id")
            if not start_date or not end_date:
                return Response(
                    {"error": "Start date and end date both are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cycles = Cycle.objects.filter(
                Q(workspace__slug=slug)
                & Q(project_id=project_id)
                & (
                    Q(start_date__lte=start_date, end_date__gte=start_date)
                    | Q(start_date__lte=end_date, end_date__gte=end_date)
                    | Q(start_date__gte=start_date, end_date__lte=end_date)
                )
            ).exclude(pk=cycle_id)

            if cycles.exists():
                return Response(
                    {
                        "error": "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
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


class CycleFavoriteViewSet(BaseViewSet):
    serializer_class = CycleFavoriteSerializer
    model = CycleFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("cycle", "cycle__owned_by")
        )

    def create(self, request, slug, project_id):
        try:
            serializer = CycleFavoriteSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user, project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The cycle is already added to favorites"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, project_id, cycle_id):
        try:
            cycle_favorite = CycleFavorite.objects.get(
                project=project_id,
                user=request.user,
                workspace__slug=slug,
                cycle_id=cycle_id,
            )
            cycle_favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CycleFavorite.DoesNotExist:
            return Response(
                {"error": "Cycle is not in favorites"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class TransferCycleIssueEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id, cycle_id):
        try:
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
        except Cycle.DoesNotExist:
            return Response(
                {"error": "New Cycle Does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
