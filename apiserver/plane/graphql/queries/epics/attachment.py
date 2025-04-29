# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension

# Strawberry Imports
from strawberry.types import Info

# Module Imports
from plane.db.models import FileAsset
from plane.graphql.helpers import (
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
)
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.asset import FileAssetType


def epic_attachment_base_query(
    workspace_id: str, project_id: str, epic_id: str, user_id: str
):
    return (
        FileAsset.objects.filter(workspace_id=workspace_id)
        .filter(project_id=project_id)
        .filter(issue_id=epic_id)
        .filter(entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT)
        .filter(is_uploaded=True)
        .filter(
            project__project_projectmember__member_id=user_id,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )
    )


@sync_to_async
def get_epic_attachments(
    workspace_id: str, project_id: str, epic_id: str, user_id: str
):
    base_query = epic_attachment_base_query(
        workspace_id=workspace_id,
        project_id=project_id,
        epic_id=epic_id,
        user_id=user_id,
    )

    base_query.order_by("-created_at")

    return list(base_query)


@sync_to_async
def get_epic_attachment(
    workspace_id: str, project_id: str, epic_id: str, user_id: str, attachment_id: str
):
    base_query = epic_attachment_base_query(
        workspace_id=workspace_id,
        project_id=project_id,
        epic_id=epic_id,
        user_id=user_id,
    )

    try:
        base_query = base_query.get(id=attachment_id)
    except FileAsset.DoesNotExist:
        message = "Epic attachment not found"
        error_extensions = {"code": "EPIC_ATTACHMENT_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)

    return base_query


@strawberry.type
class EpicAttachmentQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def epic_attachments(
        self, info: Info, slug: str, project: str, epic: str
    ) -> list[FileAssetType]:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_id = str(workspace.id)

        issue_attachments = await get_epic_attachments(
            workspace_id=workspace_id, project_id=project, epic_id=epic, user_id=user_id
        )

        return issue_attachments

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def epic_attachment(
        self, info: Info, slug: str, project: str, epic: str, attachment: str
    ) -> FileAssetType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_id = str(workspace.id)

        issue_attachment = await get_epic_attachment(
            workspace_id=workspace_id,
            project_id=project,
            epic_id=epic,
            user_id=user_id,
            attachment_id=attachment,
        )

        return issue_attachment
