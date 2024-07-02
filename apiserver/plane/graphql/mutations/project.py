# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async
from typing import Optional

# Module imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.permissions.project import (
    ProjectMemberPermission,
    ProjectBasePermission,
    ProjectAdminPermission,
)
from plane.graphql.types.project import ProjectType
from plane.db.models import Workspace, Project, ProjectMember, UserFavorite


@strawberry.type
class ProjectMutation:

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def createProject(
        self,
        info: Info,
        slug: str,
        name: str,
        identifier: str,
        network: int,
        description: Optional[str] = "",
        project_lead: Optional[str] = None,
        logo_props: Optional[JSON] = {},
    ) -> ProjectType:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        project = await sync_to_async(Project.objects.create)(
            name=name,
            identifier=identifier,
            network=network,
            description=description,
            project_lead=project_lead,
            logo_props=logo_props,
            workspace=workspace,
        )
        # add the user as a admin of the project
        _ = await sync_to_async(ProjectMember.objects.create)(
            project=project,
            member=info.context.user,
            role=20,
        )

        return project

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[ProjectMemberPermission()])
        ]
    )
    async def updateProject(
        self,
        id: strawberry.ID,
        name: str,
        slug: str,
        organizationSize: str,
        ownerId: str,
    ) -> ProjectType:
        project = await sync_to_async(Project.objects.get)(id=id)
        project.name = name
        project.slug = slug
        project.organization_size = organizationSize
        project.owner_id = ownerId
        await sync_to_async(project.save)()
        return project

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[ProjectAdminPermission()])
        ]
    )
    async def deleteProject(self, id: strawberry.ID) -> bool:
        project = await sync_to_async(Project.objects.get)(id=id)
        await sync_to_async(project.delete)()
        return True


@strawberry.type
class ProjectInviteMutation:

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[ProjectMemberPermission()])
        ]
    )
    async def inviteProjectMembers(
        self, info: Info, slug: str, project: strawberry.ID, emails: JSON
    ) -> bool:
        project = await sync_to_async(Project.objects.get)(id=project)

        # create a bulk create to send the project member invitation
        for email in emails:
            # add the user as a admin of the project
            _ = await sync_to_async(ProjectMember.objects.create)(
                project=project,
                member=email.get("user"),
                role=email.get("role"),
            )
        return True


@strawberry.type
class ProjectFavoriteMutation:

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def favoriteProject(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> bool:
        _ = await sync_to_async(UserFavorite.objects.create)(
            entity_identifier=project,
            entity_type="project",
            user=info.context.user,
            project_id=project,
        )
        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def unFavoriteProject(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> bool:
        project_favorite = await sync_to_async(UserFavorite.objects.get)(
            entity_identifier=project,
            entity_type="project",
            user=info.context.user,
            workspace__slug=slug,
        )
        await sync_to_async(project_favorite.delete)()

        return True
