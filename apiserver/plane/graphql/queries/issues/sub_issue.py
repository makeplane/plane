# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async
from typing import Optional

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension


# Module Imports
from plane.graphql.types.issue import (
    IssuesType,
)
from plane.db.models import (
    Issue,
)


from plane.graphql.permissions.project import ProjectBasePermission
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
