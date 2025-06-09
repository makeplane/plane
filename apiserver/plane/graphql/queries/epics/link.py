# Strawberry Imports
import strawberry
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import IssueLink
from plane.graphql.helpers import (
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.epics.link import EpicLinkType


def epic_link_base_query(
    workspace_id: str, project_id: str, epic_id: str, user_id: str
):
    return (
        IssueLink.objects.filter(workspace_id=workspace_id)
        .filter(project_id=project_id)
        .filter(issue_id=epic_id)
        .filter(
            project__project_projectmember__member_id=user_id,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )
    )


@sync_to_async
def get_epic_links(workspace_id: str, project_id: str, epic_id: str, user_id: str):
    base_query = epic_link_base_query(
        workspace_id=workspace_id,
        project_id=project_id,
        epic_id=epic_id,
        user_id=user_id,
    )

    base_query.order_by("-created_at")

    return list(base_query)


@sync_to_async
def get_epic_link(
    workspace_id: str, project_id: str, epic_id: str, user_id: str, link_id: str
):
    base_query = epic_link_base_query(
        workspace_id=workspace_id,
        project_id=project_id,
        epic_id=epic_id,
        user_id=user_id,
    )

    try:
        base_query = base_query.get(id=link_id)
    except Exception:
        message = "Epic link not found"
        error_extensions = {"code": "EPIC_LINK_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)

    return base_query


@strawberry.type
class EpicLinkQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic_links(
        self, info: Info, slug: str, project: str, epic: str
    ) -> list[EpicLinkType]:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_id = str(workspace.id)

        epic_links = await get_epic_links(
            workspace_id=workspace_id, project_id=project, epic_id=epic, user_id=user_id
        )

        return epic_links

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic_link(
        self, info: Info, slug: str, project: str, epic: str, link: str
    ) -> EpicLinkType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_id = str(workspace.id)

        epic_link = await get_epic_link(
            workspace_id=workspace_id,
            project_id=project,
            epic_id=epic,
            user_id=user_id,
            link_id=link,
        )

        return epic_link
