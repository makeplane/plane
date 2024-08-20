from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    Count,
    Exists,
    F,
    Func,
    IntegerField,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    UUIDField,
    Value,
    Sum,
    FloatField,
)
from django.db.models.functions import Coalesce, Cast
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from plane.app.permissions import (
    ProjectEntityPermission,
)
from plane.app.serializers import (
    ModuleDetailSerializer,
)
from plane.db.models import Issue, Module, ModuleLink, UserFavorite, Project
from plane.utils.analytics_plot import burndown_plot
from plane.utils.user_timezone_converter import user_timezone_converter


# Module imports
from .. import BaseAPIView


class ModuleArchiveUnarchiveEndpoint(BaseAPIView):

    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_queryset(self):
        favorite_subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="module",
            entity_identifier=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        cancelled_issues = (
            Issue.issue_objects.filter(
                state__group="cancelled",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        completed_issues = (
            Issue.issue_objects.filter(
                state__group="completed",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        started_issues = (
            Issue.issue_objects.filter(
                state__group="started",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        unstarted_issues = (
            Issue.issue_objects.filter(
                state__group="unstarted",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        backlog_issues = (
            Issue.issue_objects.filter(
                state__group="backlog",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        total_issues = (
            Issue.issue_objects.filter(
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(cnt=Count("pk"))
            .values("cnt")
        )
        completed_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="completed",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(
                completed_estimate_points=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("completed_estimate_points")[:1]
        )

        total_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(
                total_estimate_points=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("total_estimate_points")[:1]
        )
        backlog_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="backlog",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(
                backlog_estimate_point=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("backlog_estimate_point")[:1]
        )
        unstarted_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="unstarted",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(
                unstarted_estimate_point=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("unstarted_estimate_point")[:1]
        )
        started_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="started",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(
                started_estimate_point=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("started_estimate_point")[:1]
        )
        cancelled_estimate_point = (
            Issue.issue_objects.filter(
                estimate_point__estimate__type="points",
                state__group="cancelled",
                issue_module__module_id=OuterRef("pk"),
            )
            .values("issue_module__module_id")
            .annotate(
                cancelled_estimate_point=Sum(
                    Cast("estimate_point__value", FloatField())
                )
            )
            .values("cancelled_estimate_point")[:1]
        )
        return (
            Module.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(archived_at__isnull=False)
            .annotate(is_favorite=Exists(favorite_subquery))
            .select_related("workspace", "project", "lead")
            .prefetch_related("members")
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related(
                        "module", "created_by"
                    ),
                )
            )
            .annotate(
                completed_issues=Coalesce(
                    Subquery(completed_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                cancelled_issues=Coalesce(
                    Subquery(cancelled_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                started_issues=Coalesce(
                    Subquery(started_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                unstarted_issues=Coalesce(
                    Subquery(unstarted_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                backlog_issues=Coalesce(
                    Subquery(backlog_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                total_issues=Coalesce(
                    Subquery(total_issues[:1]),
                    Value(0, output_field=IntegerField()),
                )
            )
            .annotate(
                backlog_estimate_points=Coalesce(
                    Subquery(backlog_estimate_point),
                    Value(0, output_field=FloatField()),
                ),
            )
            .annotate(
                unstarted_estimate_points=Coalesce(
                    Subquery(unstarted_estimate_point),
                    Value(0, output_field=FloatField()),
                ),
            )
            .annotate(
                started_estimate_points=Coalesce(
                    Subquery(started_estimate_point),
                    Value(0, output_field=FloatField()),
                ),
            )
            .annotate(
                cancelled_estimate_points=Coalesce(
                    Subquery(cancelled_estimate_point),
                    Value(0, output_field=FloatField()),
                ),
            )
            .annotate(
                completed_estimate_points=Coalesce(
                    Subquery(completed_estimate_point),
                    Value(0, output_field=FloatField()),
                ),
            )
            .annotate(
                total_estimate_points=Coalesce(
                    Subquery(total_estimate_point),
                    Value(0, output_field=FloatField()),
                ),
            )
            .annotate(
                member_ids=Coalesce(
                    ArrayAgg(
                        "members__id",
                        distinct=True,
                        filter=~Q(members__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .order_by("-is_favorite", "-created_at")
        )

    def get(self, request, slug, project_id, pk=None):
        if pk is None:
            queryset = self.get_queryset()
            modules = queryset.values(  # Required fields
                "id",
                "workspace_id",
                "project_id",
                # Model fields
                "name",
                "description",
                "description_text",
                "description_html",
                "start_date",
                "target_date",
                "status",
                "lead_id",
                "member_ids",
                "view_props",
                "sort_order",
                "external_source",
                "external_id",
                # computed fields
                "total_issues",
                "is_favorite",
                "cancelled_issues",
                "completed_issues",
                "started_issues",
                "unstarted_issues",
                "backlog_issues",
                "created_at",
                "updated_at",
                "archived_at",
            )
            datetime_fields = ["created_at", "updated_at"]
            modules = user_timezone_converter(
                modules, datetime_fields, request.user.user_timezone
            )
            return Response(modules, status=status.HTTP_200_OK)
        else:
            queryset = (
                self.get_queryset()
                .filter(pk=pk)
                .annotate(
                    sub_issues=Issue.issue_objects.filter(
                        project_id=self.kwargs.get("project_id"),
                        parent__isnull=False,
                        issue_module__module_id=pk,
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
            )

            estimate_type = Project.objects.filter(
                workspace__slug=slug,
                pk=project_id,
                estimate__isnull=False,
                estimate__type="points",
            ).exists()

            data = ModuleDetailSerializer(queryset.first()).data
            modules = queryset.first()

            data["estimate_distribution"] = {}

            if estimate_type:
                assignee_distribution = (
                    Issue.issue_objects.filter(
                        issue_module__module_id=pk,
                        workspace__slug=slug,
                        project_id=project_id,
                    )
                    .annotate(first_name=F("assignees__first_name"))
                    .annotate(last_name=F("assignees__last_name"))
                    .annotate(assignee_id=F("assignees__id"))
                    .annotate(display_name=F("assignees__display_name"))
                    .annotate(avatar=F("assignees__avatar"))
                    .values(
                        "first_name",
                        "last_name",
                        "assignee_id",
                        "avatar",
                        "display_name",
                    )
                    .annotate(
                        total_estimates=Sum(
                            Cast("estimate_point__value", FloatField())
                        ),
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
                    .order_by("first_name", "last_name")
                )

                label_distribution = (
                    Issue.issue_objects.filter(
                        issue_module__module_id=pk,
                        workspace__slug=slug,
                        project_id=project_id,
                    )
                    .annotate(label_name=F("labels__name"))
                    .annotate(color=F("labels__color"))
                    .annotate(label_id=F("labels__id"))
                    .values("label_name", "color", "label_id")
                    .annotate(
                        total_estimates=Sum(
                            Cast("estimate_point__value", FloatField())
                        ),
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
                data["estimate_distribution"]["assignees"] = assignee_distribution
                data["estimate_distribution"]["labels"] = label_distribution

                if modules and modules.start_date and modules.target_date:
                    data["estimate_distribution"]["completion_chart"] = (
                        burndown_plot(
                            queryset=modules,
                            slug=slug,
                            project_id=project_id,
                            plot_type="points",
                            module_id=pk,
                        )
                    )

            assignee_distribution = (
                Issue.issue_objects.filter(
                    issue_module__module_id=pk,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(first_name=F("assignees__first_name"))
                .annotate(last_name=F("assignees__last_name"))
                .annotate(assignee_id=F("assignees__id"))
                .annotate(display_name=F("assignees__display_name"))
                .annotate(avatar=F("assignees__avatar"))
                .values(
                    "first_name",
                    "last_name",
                    "assignee_id",
                    "avatar",
                    "display_name",
                )
                .annotate(
                    total_issues=Count(
                        "id",
                        filter=Q(
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    ),
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
                .order_by("first_name", "last_name")
            )

            label_distribution = (
                Issue.issue_objects.filter(
                    issue_module__module_id=pk,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(label_name=F("labels__name"))
                .annotate(color=F("labels__color"))
                .annotate(label_id=F("labels__id"))
                .values("label_name", "color", "label_id")
                .annotate(
                    total_issues=Count(
                        "id",
                        filter=Q(
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    ),
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

            data["distribution"] = {
                "assignees": assignee_distribution,
                "labels": label_distribution,
                "completion_chart": {},
            }
            if modules and modules.start_date and modules.target_date:
                data["distribution"]["completion_chart"] = burndown_plot(
                    queryset=modules,
                    slug=slug,
                    project_id=project_id,
                    plot_type="issues",
                    module_id=pk,
                )

            return Response(
                data,
                status=status.HTTP_200_OK,
            )

    def post(self, request, slug, project_id, module_id):
        module = Module.objects.get(
            pk=module_id, project_id=project_id, workspace__slug=slug
        )
        if module.status not in ["completed", "cancelled"]:
            return Response(
                {
                    "error": "Only completed or cancelled modules can be archived"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        module.archived_at = timezone.now()
        module.save()
        UserFavorite.objects.filter(
            entity_type="module",
            entity_identifier=module_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()
        return Response(
            {"archived_at": str(module.archived_at)},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug, project_id, module_id):
        module = Module.objects.get(
            pk=module_id, project_id=project_id, workspace__slug=slug
        )
        module.archived_at = None
        module.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
