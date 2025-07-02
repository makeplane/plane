# Python Standard Library Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import IssueLink
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.issues.link import IssueLinkType


@sync_to_async
def get_issue_links(slug: str, project: strawberry.ID, issue: strawberry.ID):
    return list(
        IssueLink.objects.filter(
            workspace__slug=slug, project_id=project, issue_id=issue
        ).order_by("-created_at")
    )


@strawberry.type
class IssueLinkQuery:
    # getting issue relation issues
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issueLink(
        self, info: Info, slug: str, project: strawberry.ID, issue: strawberry.ID
    ) -> list[IssueLinkType]:
        # Get the issue links
        issue_links = await get_issue_links(slug, project, issue)
        return issue_links
