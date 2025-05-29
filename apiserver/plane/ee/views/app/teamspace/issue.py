# Django imports
from django.db.models import OuterRef, F, Func, Subquery, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import (
    Issue,
    CycleIssue,
    IssueLink,
    FileAsset,
    Workspace,
    ProjectMember,
    IssueAssignee,
)
from plane.ee.models import TeamspaceProject, TeamspaceUserProperty, TeamspaceMember
from plane.ee.serializers import TeamspaceUserPropertySerializer
from .base import TeamspaceBaseEndpoint
from plane.ee.permissions import TeamspacePermission
from plane.utils.grouper import (
    issue_group_values,
    issue_on_results,
    issue_queryset_grouper,
)
from plane.utils.issue_filters import issue_filters
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.paginator import GroupedOffsetPaginator, SubGroupedOffsetPaginator


class TeamspaceIssueEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    def get(self, request, slug, team_space_id):
        # Get projects where user has access in the team space
        accessible_project_ids = (
            ProjectMember.objects.filter(
                project_id__in=TeamspaceProject.objects.filter(
                    team_space_id=team_space_id, workspace__slug=slug
                ).values_list("project_id", flat=True),
                member=request.user,
                workspace__slug=slug,
            )
            .filter(
                Q(role__in=[15, 20]) | Q(role=5, project__guest_view_all_features=True)
            )
            .values_list("project_id", flat=True)
        )

        order_by_param = request.GET.get("order_by", "created_at")
        filters = issue_filters(request.query_params, "GET")
        issue_queryset = (
            Issue.issue_objects.filter(workspace__slug=slug)
            .filter(**filters)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related(
                "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
            )
            .filter(**filters)
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
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(project_id__in=accessible_project_ids)
        )

        # Get the issues scope
        scope = request.GET.get("scope", "projects")
        if scope == "teams":
            team_member_ids = TeamspaceMember.objects.filter(
                team_space_id=team_space_id
            ).values_list("member_id", flat=True)
            issue_ids = IssueAssignee.objects.filter(
                workspace__slug=slug, assignee_id__in=team_member_ids
            ).values_list("issue_id", flat=True)
            issue_queryset = issue_queryset.filter(pk__in=issue_ids)

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        # issue queryset
        issue_queryset = issue_queryset_grouper(
            queryset=issue_queryset, group_by=group_by, sub_group_by=sub_group_by
        )

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
                            filters=filters,
                            team_id=team_space_id,
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by,
                            slug=slug,
                            filters=filters,
                            team_id=team_space_id,
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
                        filters=filters,
                        team_id=team_space_id,
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


class TeamspaceUserPropertiesEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    def patch(self, request, slug, team_space_id):
        team_space_properties = TeamspaceUserProperty.objects.get(
            user=request.user, team_space_id=team_space_id, workspace__slug=slug
        )

        team_space_properties.filters = request.data.get(
            "filters", team_space_properties.filters
        )
        team_space_properties.display_filters = request.data.get(
            "display_filters", team_space_properties.display_filters
        )
        team_space_properties.display_properties = request.data.get(
            "display_properties", team_space_properties.display_properties
        )
        team_space_properties.save()

        serializer = TeamspaceUserPropertySerializer(team_space_properties)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug, team_space_id):
        workspace = Workspace.objects.get(slug=slug)
        team_space_properties, _ = TeamspaceUserProperty.objects.get_or_create(
            user=request.user, team_space_id=team_space_id, workspace=workspace
        )
        serializer = TeamspaceUserPropertySerializer(team_space_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)
