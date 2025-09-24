# Python Standard Library Imports
import strawberry

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.graphql.helpers import get_issue_stats_count_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.issues.base import IssueStatsType


@strawberry.type
class IssueStatsQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issue_stats(
        self, info: Info, slug: str, project: str, issue: str
    ) -> IssueStatsType:
        stats = await get_issue_stats_count_async(
            workspace_slug=slug, project_id=project, issue=issue
        )

        return stats
