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
from plane.db.models import Issue
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.types.issues.base import (
    IssuesInformationObjectType,
    IssuesInformationType,
    IssuesType,
)
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.issue import issue_information_query_execute
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.work_item_filters import work_item_filters


# workspace issues information query
@strawberry.type
class WorkspaceIssuesInformationQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
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
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
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
