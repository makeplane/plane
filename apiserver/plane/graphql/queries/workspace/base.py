# Python Standard Library Imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import Issue, Page, Project, Workspace, WorkspaceMember
from plane.graphql.permissions.workspace import IsAuthenticated, WorkspaceBasePermission
from plane.graphql.types.issues.base import (
    IssuesInformationObjectType,
    IssuesInformationType,
    IssuesType,
)
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.types.workspace import (
    WorkspaceMemberType,
    WorkspaceType,
    WorkspaceYourWorkType,
)
from plane.graphql.utils.issue import issue_information_query_execute
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.work_item_filters import work_item_filters


@strawberry.type
class WorkspaceQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[IsAuthenticated()])])
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
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspaceMembers(
        self, info: Info, slug: str
    ) -> list[WorkspaceMemberType]:
        workspace_members = await sync_to_async(list)(
            WorkspaceMember.objects.filter(
                workspace__slug=slug, is_active=True, member__is_bot=False
            )
        )
        return workspace_members


# workspace issues information query
@strawberry.type
class WorkspaceIssuesInformationQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspaceIssuesInformation(
        self,
        info: Info,
        slug: str,
        filters: Optional[JSON] = {},
        groupBy: Optional[str] = None,
        orderBy: Optional[str] = "-created_at",
    ) -> IssuesInformationType:
        filters = work_item_filters(filters)

        (issue_count, issue_group_info) = await issue_information_query_execute(
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
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspaceIssues(
        self,
        info: Info,
        slug: str,
        filters: Optional[JSON] = {},
        orderBy: Optional[str] = "-created_at",
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[IssuesType]:
        filters = work_item_filters(filters)

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
            .distinct()
        )

        return paginate(results_object=issues, cursor=cursor)


# workspace your work
@strawberry.type
class YourWorkQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def yourWork(self, info: Info, slug: str) -> WorkspaceYourWorkType:
        user = info.context.user
        user_id = str(user.id)

        # projects
        projects = await sync_to_async(list)(
            Project.objects.filter(
                workspace__slug=slug,
                project_projectmember__member_id=user_id,
                project_projectmember__is_active=True,
            ).values_list("id", flat=True)
        )

        # issues
        filters = {"assignees": [user_id]}
        filters = work_item_filters(filters)
        issues = await sync_to_async(list)(
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member_id=user_id,
                project__project_projectmember__is_active=True,
            )
            .filter(**filters)
            .values_list("id", flat=True)
            .distinct()
        )

        # pages
        pages = await sync_to_async(list)(
            Page.objects.filter(
                workspace__slug=slug,
                projects__project_projectmember__member_id=user_id,
                projects__project_projectmember__is_active=True,
                archived_at__isnull=True,
                owned_by_id=user_id,
            ).values_list("id", flat=True)
        )

        your_work = WorkspaceYourWorkType(
            projects=len(projects), issues=len(issues), pages=len(pages)
        )

        return your_work
