# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async
from typing import Optional

# Strawberry Imports
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Prefetch, Q

# Module Imports
from plane.graphql.types.issue import (
    IssuesInformationType,
    IssuesInformationObjectType,
    IssuesType,
    IssueUserPropertyType,
    IssueCommentActivityType,
    IssuePropertyActivityType,
    IssueTypesType,
)
from plane.db.models import (
    Issue,
    IssueActivity,
    IssueUserProperty,
    IssueComment,
    CommentReaction,
    IssueType,
)
from plane.graphql.utils.issue_filters import issue_filters
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.issue import issue_information_query_execute


# issues information query
@strawberry.type
class IssuesInformationQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issuesInformation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        filters: Optional[JSON] = {},
        groupBy: Optional[str] = None,
        orderBy: Optional[str] = "-created_at",
    ) -> IssuesInformationType:
        filters = issue_filters(filters, "POST")

        # all issues tab information
        (
            all_issue_count,
            all_issue_group_info,
        ) = await issue_information_query_execute(
            user=info.context.user,
            slug=slug,
            project=project,
            filters=filters,
            groupBy=groupBy,
            orderBy=orderBy,
        )

        # active issues tab information
        filters["state__group__in"] = ["unstarted", "started"]
        (
            active_issue_count,
            active_issue_group_info,
        ) = await issue_information_query_execute(
            user=info.context.user,
            slug=slug,
            project=project,
            filters=filters,
            groupBy=groupBy,
            orderBy=orderBy,
        )

        # backlog issues tab information
        filters["state__group__in"] = ["backlog"]
        (
            backlog_issue_count,
            backlog_issue_group_info,
        ) = await issue_information_query_execute(
            user=info.context.user,
            slug=slug,
            project=project,
            filters=filters,
            groupBy=groupBy,
            orderBy=orderBy,
        )

        issue_information = IssuesInformationType(
            all=IssuesInformationObjectType(
                totalIssues=all_issue_count, groupInfo=all_issue_group_info
            ),
            active=IssuesInformationObjectType(
                totalIssues=active_issue_count,
                groupInfo=active_issue_group_info,
            ),
            backlog=IssuesInformationObjectType(
                totalIssues=backlog_issue_count,
                groupInfo=backlog_issue_group_info,
            ),
        )

        return issue_information


# issues query
@strawberry.type
class IssueQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issues(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        filters: Optional[JSON] = {},
        orderBy: Optional[str] = "-created_at",
        cursor: Optional[str] = None,
        type: Optional[str] = "all",
    ) -> PaginatorResponse[IssuesType]:
        filters = issue_filters(filters, "POST")

        # Filter issues based on the type
        if type == "backlog":
            filters["state__group__in"] = ["backlog"]
        elif type == "active":
            filters["state__group__in"] = ["unstarted", "started"]

        issues = await sync_to_async(list)(
            Issue.issue_objects.filter(
                workspace__slug=slug, project_id=project
            )
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .order_by(orderBy, "-created_at")
            .filter(**filters)
        )

        return paginate(results_object=issues, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issue(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> IssuesType:
        issue = await sync_to_async(Issue.issue_objects.get)(
            workspace__slug=slug,
            project_id=project,
            id=issue,
            project__project_projectmember__member=info.context.user,
            project__project_projectmember__is_active=True,
        )
        return issue


@strawberry.type
class RecentIssuesQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def recent_issues(self, info: Info, slug: str) -> list[IssuesType]:
        # Fetch the top 5 recent issue IDs from the activity table
        issue_ids_coroutine = sync_to_async(list)(
            IssueActivity.objects.filter(
                workspace__slug=slug, actor=info.context.user
            )
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
            .order_by("-created_at")
            .values_list("issue", flat=True)
            .distinct()
        )

        issue_ids = await issue_ids_coroutine

        # Fetch the actual issues using the filtered issue IDs
        issues = await sync_to_async(list)(
            Issue.issue_objects.filter(
                workspace__slug=slug, pk__in=issue_ids
            ).filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )[:5]
        )

        return issues


@strawberry.type
class IssueUserPropertyQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issue_user_properties(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
    ) -> IssueUserPropertyType:
        def get_issue_user_property():
            issue_properties, _ = IssueUserProperty.objects.get_or_create(
                workspace__slug=slug,
                project_id=project,
                user=info.context.user,
            )
            return issue_properties

        issue_property = await sync_to_async(
            lambda: get_issue_user_property()
        )()

        return issue_property


@strawberry.type
class IssuePropertiesActivityQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issue_property_activities(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> list[IssuePropertyActivityType]:
        issue_activities = await sync_to_async(list)(
            IssueActivity.objects.filter(
                issue_id=issue, project_id=project, workspace__slug=slug
            )
            .filter(
                ~Q(field__in=["comment", "vote", "reaction", "draft"]),
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
                workspace__slug=slug,
            )
            .select_related("actor", "workspace", "issue", "project")
            .order_by("created_at")
        )

        return issue_activities


@strawberry.type
class IssueCommentActivityQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issue_comment_activities(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> list[IssueCommentActivityType]:
        issue_comments = await sync_to_async(list)(
            IssueComment.objects.filter(
                issue_id=issue, project_id=project, workspace__slug=slug
            )
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("created_at")
            .select_related("actor", "issue", "project", "workspace")
            .prefetch_related(
                Prefetch(
                    "comment_reactions",
                    queryset=CommentReaction.objects.select_related("actor"),
                )
            )
        )

        return issue_comments


# User profile issues
@strawberry.type
class WorkspaceIssuesQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def workspace_issues(
        self,
        info: Info,
        slug: str,
        filters: Optional[JSON] = {},
        orderBy: Optional[str] = "-created_at",
        cursor: Optional[str] = None,
    ) -> list[IssuesType]:
        workspace_issues = await sync_to_async(list)(
            Issue.issue_objects.filter(
                project__project_projectmember__member=info.context.user,
                project__projectmember__is_active=True,
                workspace__slug=slug,
            )
            .select_related("actor", "issue", "project", "workspace")
            .order_by(orderBy, "-created_at")
            .filter(**filters)
        )

        return paginate(results_object=workspace_issues, cursor=cursor)


@strawberry.type
class SubIssuesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def sub_issues(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[IssuesType]:
        sub_issues = await sync_to_async(list)(
            Issue.issue_objects.filter(
                workspace__slug=slug,
                parent_id=issue,
            )
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .order_by("-created_at")
        )

        return paginate(results_object=sub_issues, cursor=cursor)


@strawberry.type
class IssueTypesTypeQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def issueTypes(self, info: Info, slug: str) -> list[IssueTypesType]:
        issue_types = await sync_to_async(list)(
            IssueType.objects.filter(workspace__slug=slug).distinct()
        )

        return issue_types
