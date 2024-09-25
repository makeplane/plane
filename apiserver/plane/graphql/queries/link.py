# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import IssueLink
from plane.graphql.types.link import IssueLinkType
from plane.graphql.permissions.project import ProjectBasePermission


@strawberry.type
class IssueLinkQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issueLink(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> list[IssueLinkType]:

        issue_links = await sync_to_async(list)(
            IssueLink.objects.filter(
                issue_id=issue, workspace__slug=slug, project_id=project
            ).order_by("-created_at")
        )
        return issue_links
