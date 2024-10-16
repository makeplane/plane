# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import FileAsset
from plane.graphql.types.issues.attachment import IssueAttachmentType
from plane.graphql.permissions.project import ProjectBasePermission


@strawberry.type
class IssueAttachmentQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issue_attachment(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> list[IssueAttachmentType]:
        print("---*___")
        print("Attachment query")
        print("---*___")
        issue_attachments = await sync_to_async(list)(
            FileAsset.objects.filter(
                workspace__slug=slug,
                project_id=project,
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                issue=issue,
            )
        )

        return issue_attachments
