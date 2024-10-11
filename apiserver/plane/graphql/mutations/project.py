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
from plane.db.models import (
    Workspace,
    Project,
    ProjectMember,
    UserFavorite,
    IssueUserProperty,
    State,
)


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
        description: Optional[str] = "",
        network: int = 2,
        project_lead: Optional[str] = None,
        logo_props: Optional[JSON] = {},
        page_view: Optional[bool] = False,
    ) -> ProjectType:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        project = await sync_to_async(Project.objects.create)(
            name=name,
            identifier=identifier,
            description=description,
            network=network,
            logo_props=logo_props,
            page_view=page_view,
            workspace=workspace,
        )

        # add the user as a admin of the project
        _ = await sync_to_async(ProjectMember.objects.create)(
            project=project,
            member=info.context.user,
            role=20,
        )
        # creating the issue property for the user
        _ = await sync_to_async(IssueUserProperty.objects.create)(
            project_id=project.id,
            user_id=info.context.user.id,
        )

        # if lead was passed we can add the user as a lead
        if project_lead:
            # add the user as a admin of the project
            _ = await sync_to_async(ProjectMember.objects.create)(
                project=project,
                member_id=project_lead,
                role=20,
            )
            # creating the issue property for the user
            _ = await sync_to_async(IssueUserProperty.objects.create)(
                project_id=project.id,
                user_id=project_lead,
            )

        # Default states
        states = [
            {
                "name": "Backlog",
                "color": "#A3A3A3",
                "sequence": 15000,
                "group": "backlog",
                "default": True,
            },
            {
                "name": "Todo",
                "color": "#3A3A3A",
                "sequence": 25000,
                "group": "unstarted",
            },
            {
                "name": "In Progress",
                "color": "#F59E0B",
                "sequence": 35000,
                "group": "started",
            },
            {
                "name": "Done",
                "color": "#16A34A",
                "sequence": 45000,
                "group": "completed",
            },
            {
                "name": "Cancelled",
                "color": "#EF4444",
                "sequence": 55000,
                "group": "cancelled",
            },
        ]

        # creating the default states for the project
        _ = await sync_to_async(State.objects.bulk_create)(
            [
                State(
                    name=state["name"],
                    color=state["color"],
                    project=project,
                    sequence=state["sequence"],
                    workspace=workspace,
                    group=state["group"],
                    default=state.get("default", False),
                    created_by=info.context.user,
                )
                for state in states
            ]
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
        slug: str,
        name: Optional[str] = None,
        identifier: Optional[str] = None,
        description: Optional[str] = None,
        network: Optional[int] = None,
        logo_props: Optional[JSON] = None,
        page_view: Optional[bool] = None,
    ) -> ProjectType:
        project = await sync_to_async(Project.objects.get)(id=id)
        if name is not None:
            project.name = name
        if identifier is not None:
            project.identifier = identifier
        if description is not None:
            project.description = description
        if network is not None:
            project.network = network
        if logo_props is not None:
            project.logo_props = logo_props
        if page_view is not None:
            project.page_view = page_view
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
