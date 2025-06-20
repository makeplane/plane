# Third-Party Imports
from typing import Optional

# Python Standard Library Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Issue
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.issues.base import IssuesType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


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
        user = info.context.user
        user_id = str(user.id)

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        sub_issues = await sync_to_async(list)(
            Issue.issue_objects.filter(workspace__slug=slug, parent_id=issue)
            .filter(project_teamspace_filter.query)
            .distinct()
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .order_by("-created_at")
        )

        return paginate(results_object=sub_issues, cursor=cursor)
