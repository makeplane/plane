# Python imports
import json
from dataclasses import asdict
from typing import Optional

import strawberry

# Third-party imports
from asgiref.sync import sync_to_async

# Django imports
from django.core.validators import URLValidator
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import IssueLink
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.helpers import (
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.epics.link import (
    EpicLinkCreateInputType,
    EpicLinkType,
    EpicLinkUpdateInputType,
)
from plane.graphql.utils.roles import Roles


def epic_link_base_query(
    workspace_id: str, project_id: str, epic_id: str, user_id: str
):
    project_teamspace_filter = project_member_filter_via_teamspaces(
        user_id=user_id,
        workspace_slug=workspace_id,
    )
    return (
        IssueLink.objects.filter(workspace_id=workspace_id)
        .filter(project_id=project_id)
        .filter(issue_id=epic_id)
        .filter(project_teamspace_filter.query)
        .order_by("-created_at")
        .distinct()
    )


@sync_to_async
def epic_link_exists(
    workspace_id: str,
    project_id: str,
    epic_id: str,
    user_id: str,
    url: str,
    exclude_link_id: Optional[strawberry.ID] = None,
):
    epic_link_query = epic_link_base_query(
        workspace_id=workspace_id,
        project_id=project_id,
        epic_id=epic_id,
        user_id=user_id,
    )

    epic_link_query = epic_link_query.filter(url=url)

    if exclude_link_id:
        epic_link_query = epic_link_query.exclude(pk=exclude_link_id)

    return epic_link_query.exists()


@sync_to_async
def get_epic_link(
    workspace_id: str, project_id: str, epic_id: str, user_id: str, link_id: str
):
    try:
        epic_link_query = epic_link_base_query(
            workspace_id=workspace_id,
            project_id=project_id,
            epic_id=epic_id,
            user_id=user_id,
        )
        epic_link = epic_link_query.get(id=link_id)
        return epic_link
    except IssueLink.DoesNotExist:
        message = "Epic link not found"
        error_extensions = {"code": "EPIC_LINK_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def create_epic_link_sync(
    workspace_id: str,
    project_id: str,
    epic_id: str,
    link_input: EpicLinkCreateInputType,
):
    try:
        return IssueLink.objects.create(
            workspace_id=workspace_id,
            project_id=project_id,
            issue_id=epic_id,
            **asdict(link_input),
        )
    except Exception:
        message = "Not able to create the epic link"
        error_extensions = {"code": "EPIC_LINK_NOT_CREATED", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def remove_epic_link_sync(epic_link: IssueLink):
    try:
        return epic_link.delete()
    except Exception:
        message = "Not able to delete the epic link"
        error_extensions = {"code": "EPIC_LINK_NOT_DELETED", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class EpicLinkMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def create_epic_link(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        link_input: EpicLinkCreateInputType,
    ) -> EpicLinkType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # getting the workspace,
        workspace = await get_workspace(slug)
        workspace_id = str(workspace.id)

        link_url = link_input.url

        if not link_url or not link_url.startswith(("http://", "https://")):
            message = "Invalid URL"
            error_extensions = {"code": "INVALID_URL", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        if await epic_link_exists(
            workspace_id=workspace_id,
            project_id=project,
            epic_id=epic,
            user_id=user_id,
            url=link_url,
        ):
            message = "Epic link already exists"
            error_extensions = {"code": "EPIC_LINK_ALREADY_EXISTS", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        try:
            url_validator = URLValidator()
            url_validator(link_url)
        except Exception:
            message = "Invalid URL"
            error_extensions = {"code": "INVALID_URL", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # creating the epic link
        epic_link = await create_epic_link_sync(
            workspace_id=workspace_id,
            project_id=project,
            epic_id=epic,
            link_input=link_input,
        )
        epic_link_id = str(epic_link.id)

        # tracking the epic link activity
        epic_link_activity_payload = {
            "id": epic_link_id,
            "title": epic_link.title,
            "url": epic_link.url,
        }
        issue_activity.delay(
            type="link.activity.created",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=project,
            issue_id=epic,
            actor_id=user_id,
            current_instance=None,
            requested_data=json.dumps(epic_link_activity_payload),
        )

        return epic_link

    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def update_epic_link(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        link: str,
        link_input: EpicLinkUpdateInputType,
    ) -> EpicLinkType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # getting the workspace
        workspace = await get_workspace(slug)
        workspace_id = str(workspace.id)

        epic_link = await get_epic_link(
            workspace_id=workspace_id,
            project_id=project,
            epic_id=epic,
            user_id=user_id,
            link_id=link,
        )
        epic_link_id = str(epic_link.id)

        current_epic_link_activity_payload = {
            "id": epic_link_id,
            "url": epic_link.url,
            "title": epic_link.title,
        }

        link_url = link_input.url

        if link_url is not None and link_url != epic_link.url:
            link_url = link_url.strip()

            if not link_url.startswith(("http://", "https://")):
                message = "Invalid URL"
                error_extensions = {"code": "INVALID_URL", "statusCode": 400}
                raise GraphQLError(message, extensions=error_extensions)

            link_exists = await epic_link_exists(
                workspace_id=workspace_id,
                project_id=project,
                epic_id=epic,
                user_id=user_id,
                url=link_url,
            )
            if link_exists:
                message = "Epic link already exists"
                error_extensions = {
                    "code": "EPIC_LINK_ALREADY_EXISTS",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)

            try:
                url_validator = URLValidator()
                url_validator(link_url)
            except Exception:
                message = "Invalid URL"
                error_extensions = {"code": "INVALID_URL", "statusCode": 400}
                raise GraphQLError(message, extensions=error_extensions)

        for key, value in asdict(link_input).items():
            if value is not None:
                setattr(epic_link, key, value)

        await sync_to_async(epic_link.save)()

        # Track the issue link activity
        epic_link_activity_payload = {
            "id": str(epic_link.id),
            "title": epic_link.title,
            "url": epic_link.url,
        }
        issue_activity.delay(
            type="link.activity.updated",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=epic_link_id,
            actor_id=user_id,
            current_instance=json.dumps(current_epic_link_activity_payload),
            requested_data=json.dumps(epic_link_activity_payload),
        )

        return epic_link

    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def delete_epic_link(
        self, info: Info, slug: str, project: str, epic: str, link: str
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        workspace = await get_workspace(slug)
        workspace_id = str(workspace.id)

        epic_link = await get_epic_link(
            workspace_id=workspace_id,
            project_id=project,
            epic_id=epic,
            user_id=user_id,
            link_id=link,
        )
        epic_link_id = str(epic_link.id)

        await remove_epic_link_sync(epic_link=epic_link)

        # Track the issue link activity
        epic_link_activity_payload = {
            "id": epic_link_id,
            "url": epic_link.url,
            "title": epic_link.title,
        }
        issue_activity.delay(
            type="link.activity.updated",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=epic_link_id,
            actor_id=user_id,
            current_instance=json.dumps(epic_link_activity_payload),
            requested_data=json.dumps({"link_id": str(epic_link_id)}),
        )

        return True
