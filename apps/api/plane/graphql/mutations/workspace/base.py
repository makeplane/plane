# Python imports
import os
from dataclasses import asdict

# Strawberry imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.bgtasks.workspace_seed_task import workspace_seed
from plane.db.models import Workspace, WorkspaceMember
from plane.graphql.permissions.workspace import IsAuthenticated, WorkspacePermission
from plane.graphql.types.workspace import (
    WorkspaceCreateInputType,
    WorkspaceSlugVerificationInputType,
    WorkspaceType,
    WorkspaceUpdateInputType,
)
from plane.graphql.utils.roles import Roles
from plane.graphql.utils.url import contains_url
from plane.license.utils.instance_value import get_configuration_value
from plane.payment.bgtasks.member_sync_task import member_sync_task


# validate workspace creation enabled
@sync_to_async
def validate_workspace_creation_enabled() -> bool:
    try:
        default_value = os.environ.get("DISABLE_WORKSPACE_CREATION", "0")
        (DISABLE_WORKSPACE_CREATION,) = get_configuration_value(
            [{"key": "DISABLE_WORKSPACE_CREATION", "default": default_value}]
        )

        if DISABLE_WORKSPACE_CREATION == "1":
            message = "Workspace creation is disabled"
            error_extensions = {
                "code": "WORKSPACE_CREATION_DISABLED",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        return True
    except Exception:
        message = "Error checking if workspace creation is enabled"
        error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


# workspace slug check
@sync_to_async
def validate_workspace_slug(workspace_slug: str) -> bool:
    try:
        workspaces = Workspace.objects.filter(slug=workspace_slug)
        workspace_exists = workspaces.exists()
        return workspace_exists
    except Exception:
        message = "Error validating workspace slug"
        error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


# get workspace by slug
@sync_to_async
def get_workspace_by_slug(workspace_slug: str) -> Workspace:
    try:
        workspace = Workspace.objects.get(slug=workspace_slug)
        return workspace
    except Workspace.DoesNotExist:
        message = "Workspace not found"
        error_extensions = {"code": "WORKSPACE_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)
    except Exception:
        message = "Error getting workspace by slug"
        error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


# workspace create
@sync_to_async
def create_workspace(
    user_id: str, workspace_input: WorkspaceCreateInputType
) -> Workspace:
    try:
        workspace_payload = {
            "name": workspace_input.name,
            "slug": workspace_input.slug,
            "organization_size": workspace_input.organization_size,
            "owner_id": user_id,
        }
        return Workspace.objects.create(**workspace_payload)
    except Exception:
        message = "Error creating workspace"
        error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


# workspace update
@sync_to_async
def update_workspace(
    workspace: Workspace, workspace_input: WorkspaceUpdateInputType
) -> Workspace:
    try:
        for key, value in asdict(workspace_input).items():
            setattr(workspace, key, value)
        workspace.save()
        return workspace
    except Exception:
        message = "Error updating workspace"
        error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


# create workspace member
@sync_to_async
def create_workspace_member(
    user_id: str, workspace_id: str, role: int, company_role: str = ""
) -> WorkspaceMember:
    try:
        return WorkspaceMember.objects.create(
            member_id=user_id,
            workspace_id=workspace_id,
            role=role,
            company_role=company_role,
        )
    except Exception:
        message = "Error creating workspace member"
        error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class WorkspaceMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[(IsAuthenticated())])]
    )
    async def workspace_slug_check(
        self, info: Info, workspace_slug_input: WorkspaceSlugVerificationInputType
    ) -> bool:
        await validate_workspace_creation_enabled()

        workspace_slug = workspace_slug_input.slug
        workspace_exists = await validate_workspace_slug(workspace_slug=workspace_slug)

        return workspace_exists

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[(IsAuthenticated())])]
    )
    async def create_workspace(
        self, info: Info, workspace_input: WorkspaceCreateInputType
    ) -> WorkspaceType:
        user = info.context.user
        user_id = user.id

        await validate_workspace_creation_enabled()

        workspace_name = workspace_input.name
        workspace_slug = workspace_input.slug

        if not workspace_name or not workspace_slug:
            message = "Workspace name and slug are required"
            error_extensions = {
                "code": "WORKSPACE_NAME_AND_SLUG_REQUIRED",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        if len(workspace_name) > 80 or len(workspace_slug) > 48:
            message = "Workspace name and slug must be less than 80 and 48 characters respectively"
            error_extensions = {
                "code": "WORKSPACE_NAME_AND_SLUG_TOO_LONG",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        if contains_url(workspace_name):
            message = "Workspace name cannot contain a URL"
            error_extensions = {
                "code": "WORKSPACE_NAME_CONTAINS_URL",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        workspace_exists = await validate_workspace_slug(workspace_slug=workspace_slug)
        if workspace_exists:
            message = "Workspace slug already exists"
            error_extensions = {
                "code": "WORKSPACE_SLUG_ALREADY_EXISTS",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        workspace = await create_workspace(
            user_id=user_id, workspace_input=workspace_input
        )
        workspace_id = str(workspace.id)

        await create_workspace_member(
            user_id=user_id, workspace_id=workspace.id, role=20
        )

        # workspace seed data
        workspace_seed.delay(workspace_id)

        # sync workspace members
        member_sync_task.delay(workspace_slug)

        return workspace

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[WorkspacePermission(roles=[Roles.ADMIN])])
        ]
    )
    async def update_workspace(
        self, info: Info, slug: str, workspace_input: WorkspaceUpdateInputType
    ) -> WorkspaceType:
        workspace = await get_workspace_by_slug(workspace_slug=slug)

        workspace = await update_workspace(
            workspace=workspace, workspace_input=workspace_input
        )

        return workspace
