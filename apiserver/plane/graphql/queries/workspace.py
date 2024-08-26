# Third-Party Imports
import strawberry
from typing import Optional
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Q

# Module Imports
from plane.graphql.types.workspace import (
    WorkspaceType,
    WorkspaceMemberType,
    WorkspaceYourWorkType,
)
from plane.db.models import Workspace, WorkspaceMember, Issue, Project, Page
from plane.graphql.utils.issue_filters import issue_filters
from plane.graphql.types.issue import (
    IssuesInformationType,
    IssuesInformationObjectType,
    IssuesType,
)
from plane.graphql.permissions.workspace import (
    WorkspaceBasePermission,
    IsAuthenticated,
)
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.issue import issue_information_query_execute


@strawberry.type
class WorkspaceQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def workspaces(self, info: Info) -> list[WorkspaceType]:
        workspaces = await sync_to_async(list)(
            Workspace.objects.filter(
                workspace_member__member=info.context.user,
                workspace_member__is_active=True,
            ).order_by("-created_at")
        )

        return workspaces


@strawberry.type
class WorkspaceMembersQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def workspaceMembers(
        self, info: Info, slug: str
    ) -> list[WorkspaceMemberType]:
        workspace_members = await sync_to_async(list)(
            WorkspaceMember.objects.filter(
                workspace__slug=slug,
                is_active=True,
            )
        )
        return workspace_members


# workspace issues information query
@strawberry.type
class WorkspaceIssuesInformationQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def workspaceIssuesInformation(
        self,
        info: Info,
        slug: str,
        filters: Optional[JSON] = {},
        groupBy: Optional[str] = None,
        orderBy: Optional[str] = "-created_at",
    ) -> IssuesInformationType:
        filters = issue_filters(filters, "POST")

        (
            issue_count,
            issue_group_info,
        ) = await issue_information_query_execute(
            user=info.context.user,
            slug=slug,
            filters=filters,
            groupBy=groupBy,
            orderBy=orderBy,
        )

        issue_information = IssuesInformationType(
            all=IssuesInformationObjectType(
                totalIssues=issue_count, groupInfo=issue_group_info
            ),
            active=None,
            backlog=None,
        )

        return issue_information


# workspace issues query
@strawberry.type
class WorkspaceIssuesQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def workspaceIssues(
        self,
        info: Info,
        slug: str,
        filters: Optional[JSON] = {},
        orderBy: Optional[str] = "-created_at",
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[IssuesType]:
        filters = issue_filters(filters, "POST")

        issues = await sync_to_async(list)(
            Issue.issue_objects.filter(workspace__slug=slug)
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


# workspace your work
@strawberry.type
class YourWorkQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def yourWork(
        self,
        info: Info,
        slug: str,
    ) -> WorkspaceYourWorkType:
        # projects
        projects = await sync_to_async(list)(
            Project.objects.filter(workspace__slug=slug)
            .filter(
                Q(
                    project_projectmember__member=info.context.user,
                    project_projectmember__is_active=True,
                )
            )
            .values_list("id", flat=True)
        )

        # issues
        issues = await sync_to_async(list)(
            Issue.objects.filter(workspace__slug=slug)
            .filter(
                Q(
                    project__project_projectmember__member=info.context.user,
                    project__project_projectmember__is_active=True,
                    state__group__in=["unstarted", "started"],
                    assignees__in=[info.context.user],
                ),
            )
            .values_list("id", flat=True)
        )

        # pages
        pages = await sync_to_async(list)(
            Page.objects.filter(workspace__slug=slug)
            .filter(
                Q(
                    projects__project_projectmember__member=info.context.user,
                    projects__project_projectmember__is_active=True,
                    archived_at__isnull=True,
                    owned_by=info.context.user,
                ),
            )
            .values_list("id", flat=True)
        )

        your_work = WorkspaceYourWorkType(
            projects=len(projects), issues=len(issues), pages=len(pages)
        )

        return your_work
