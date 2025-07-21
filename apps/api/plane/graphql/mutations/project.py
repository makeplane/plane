# Python imports
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import (
    IssueUserProperty,
    Project,
    ProjectMember,
    State,
    UserFavorite,
    Workspace,
    WorkspaceMember,
)
from plane.ee.models import ProjectFeature
from plane.graphql.permissions.project import (
    ProjectAdminPermission,
    ProjectBasePermission,
    ProjectMemberPermission,
)
from plane.graphql.permissions.workspace import (
    WorkspaceBasePermission,
    WorkspacePermission,
)
from plane.graphql.types.project import ProjectType
from plane.graphql.utils.roles import Roles


@strawberry.type
class ProjectMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[WorkspacePermission([Roles.ADMIN, Roles.MEMBER])]
            )
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
        cover_image: Optional[str] = None,
        project_lead: Optional[strawberry.ID] = None,
        logo_props: Optional[JSON] = {},
        page_view: Optional[bool] = True,
        module_view: Optional[bool] = True,
        cycle_view: Optional[bool] = True,
        issue_views_view: Optional[bool] = True,
    ) -> ProjectType:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)

        try:
            project = await sync_to_async(Project.objects.create)(
                name=name,
                identifier=identifier,
                description=description,
                network=network,
                logo_props=logo_props,
                cover_image=cover_image,
                page_view=page_view,
                module_view=module_view,
                cycle_view=cycle_view,
                issue_views_view=issue_views_view,
                workspace=workspace,
            )
        except Exception:
            message = "Project with this identifier already exists"
            error_extensions = {"code": "IDENTIFIER_ALREADY_EXISTS", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # add the user as a admin of the project
        _ = await sync_to_async(ProjectMember.objects.create)(
            project=project, member=info.context.user, role=20
        )
        # creating the issue property for the user
        _ = await sync_to_async(IssueUserProperty.objects.create)(
            project_id=project.id, user_id=info.context.user.id
        )

        # if lead was passed we can add the user as a lead
        if project_lead:
            # add the user as a admin of the project
            _ = await sync_to_async(ProjectMember.objects.create)(
                project=project, member_id=project_lead, role=20
            )
            # creating the issue property for the user
            _ = await sync_to_async(IssueUserProperty.objects.create)(
                project_id=project.id, user_id=project_lead
            )

        # Default states
        states = [
            {
                "name": "Backlog",
                "color": "#60646C",
                "sequence": 15000,
                "group": "backlog",
                "default": True,
            },
            {
                "name": "Todo",
                "color": "#60646C",
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
                "color": "#46A758",
                "sequence": 45000,
                "group": "completed",
            },
            {
                "name": "Cancelled",
                "color": "#9AA4BC",
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

        # Project feature
        _ = await sync_to_async(ProjectFeature.objects.create)(
            workspace_id=workspace.id, project_id=project.id
        )

        return project

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
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
        module_view: Optional[bool] = None,
        cycle_view: Optional[bool] = None,
        issue_views_view: Optional[bool] = None,
        cover_image: Optional[str] = None,
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
        if module_view is not None:
            project.module_view = module_view
        if cycle_view is not None:
            project.cycle_view = cycle_view
        if issue_views_view is not None:
            project.issue_views_view = issue_views_view
        if cover_image is not None:
            project.cover_image = cover_image
        await sync_to_async(project.save)()
        return project

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectAdminPermission()])]
    )
    async def deleteProject(self, id: strawberry.ID) -> bool:
        project = await sync_to_async(Project.objects.get)(id=id)
        await sync_to_async(project.delete)()
        return True


@strawberry.type
class ProjectInviteMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def inviteProjectMembers(
        self, info: Info, slug: str, project: strawberry.ID, emails: JSON
    ) -> bool:
        project = await sync_to_async(Project.objects.get)(id=project)

        # create a bulk create to send the project member invitation
        for email in emails:
            # add the user as a admin of the project
            _ = await sync_to_async(ProjectMember.objects.create)(
                project=project, member=email.get("user"), role=email.get("role")
            )
        return True


@strawberry.type
class JoinProjectMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def joinProject(self, info: Info, slug: str, project: strawberry.ID) -> bool:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        project = await sync_to_async(Project.objects.get)(id=project)

        # validating is the user is in the workspace or not
        try:
            workspace_member = await sync_to_async(WorkspaceMember.objects.get)(
                workspace=workspace, member=info.context.user
            )
        except WorkspaceMember.DoesNotExist:
            message = "User is not part of the workspace"
            error_extensions = {"code": "USER_NOT_PART_OF_WORKSPACE", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        workspace_role = workspace_member.role

        # validating the workspace role
        if workspace_role not in [Roles.ADMIN.value, Roles.MEMBER.value]:
            message = "User does not have permission to join the project"
            error_extensions = {
                "code": "USER_DOES_NOT_HAVE_PERMISSION",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        # add the user as a admin of the project
        user = info.context.user
        _ = await sync_to_async(ProjectMember.objects.create)(
            workspace=workspace,
            project=project,
            member=user,
            role=workspace_role,
            created_by=user,
        )
        # creating the issue property for the user
        _ = await sync_to_async(IssueUserProperty.objects.create)(
            workspace=workspace, project=project, user=user, created_by=user
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
