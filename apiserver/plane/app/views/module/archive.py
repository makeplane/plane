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
)
from django.db.models.functions import Coalesce
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
from plane.db.models import Issue, Module, ModuleLink, UserFavorite
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
            entity_identifier=OuterRef("pk"),
            entity_type="module",
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
        return (
            Module.objects.filter(workspace__slug=self.kwargs.get("slug"))
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
            assignee_distribution = (
                Issue.objects.filter(
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
                .order_by("first_name", "last_name")
            )

            label_distribution = (
                Issue.objects.filter(
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

            data = ModuleDetailSerializer(queryset.first()).data
            data["distribution"] = {
                "assignees": assignee_distribution,
                "labels": label_distribution,
                "completion_chart": {},
            }

            # Fetch the modules
            modules = queryset.first()
            if modules and modules.start_date and modules.target_date:
                data["distribution"]["completion_chart"] = burndown_plot(
                    queryset=modules,
                    slug=slug,
                    project_id=project_id,
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
