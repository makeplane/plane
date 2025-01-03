# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import FileAsset
from plane.graphql.types.asset import FileAssetType
from plane.graphql.permissions.project import ProjectBasePermission


@strawberry.type
class IssueAttachmentQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issue_attachment(
        self, info: Info, slug: str, project: strawberry.ID, issue: strawberry.ID
    ) -> list[FileAssetType]:
        issue_attachments = await sync_to_async(list)(
            FileAsset.objects.filter(
                workspace__slug=slug,
                project_id=project,
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                issue=issue,
                is_uploaded=True,
            )
        )

        return issue_attachments

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issue_attachment_detail(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        attachment: strawberry.ID,
    ) -> FileAssetType:
        issue_attachment = await sync_to_async(FileAsset.objects.get)(
            workspace__slug=slug,
            project_id=project,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            issue=issue,
            id=attachment,
        )

        if not issue_attachment.is_uploaded:
            message = "The attachment is not uploaded."
            error_extensions = {"code": "ATTACHMENT_NOT_UPLOADED", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        return issue_attachment
