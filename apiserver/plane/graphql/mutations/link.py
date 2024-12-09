# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import (
    IssueLink,
)
from plane.graphql.types.link import IssueLinkType
from plane.graphql.permissions.project import ProjectBasePermission
# from plane.graphql.utils.issue import issue_activity


@strawberry.type
class IssueLinkMutation:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def createIssueLink(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        url: str,
        title: str,
    ) -> IssueLinkType:

        if not url.startswith(("http://", "https://")):
            raise ValueError("Invalid URL")

        if await sync_to_async(
            IssueLink.objects.filter(
                url=url,
                issue_id=issue,
            ).exists
        )():
            raise ValueError("Issue link already exists")

        issue_links = await sync_to_async(IssueLink.objects.create)(
            issue_id=issue,
            project_id=project,
            url=url,
            title=title,
        )

        # await sync_to_async(
        #     issue_activity.delay(
        #         type="link.activity.created",
        #         requested_data=json.dumps(issue_links),
        #         actor_id=str(info.context.user.id),
        #         issue_id=str(issue),
        #         project_id=str(project.id),
        #         current_instance=None,
        #         epoch=int(timezone.now().timestamp()),
        #         notification=True,
        #         origin=info.context.request.META.get("HTTP_ORIGIN"),
        #     )
        # )()

        return issue_links
