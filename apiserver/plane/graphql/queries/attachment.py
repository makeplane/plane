# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import FileAsset
from plane.graphql.types.attachment import IssueAttachmentType
from plane.graphql.permissions.project import ProjectBasePermission


@strawberry.type
class IssueAttachmentQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issueAttachment(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> list[IssueAttachmentType]:

        issue_attachments = await sync_to_async(list)(
            FileAsset.objects.filter(
                entity_identifier=issue,
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                workspace__slug=slug,
                project_id=project,
            )
        )
        return issue_attachments
