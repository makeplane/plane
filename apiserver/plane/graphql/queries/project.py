# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Exists, OuterRef, Q

# Module Imports
from plane.graphql.types.project import ProjectType, ProjectMemberType
from plane.db.models import Project, ProjectMember, UserFavorite
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.permissions.project import ProjectBasePermission


@strawberry.type
class ProjectQuery:

    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def projects(self, info: Info, slug: str) -> list[ProjectType]:
        project = await sync_to_async(list)(
            Project.objects.filter(workspace__slug=slug)
            .filter(
                Q(
                    project_projectmember__member=info.context.user,
                    project_projectmember__is_active=True,
                )
                | Q(network=2)
            )
            .annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=info.context.user,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                )
            )
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=info.context.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=slug,
                        is_active=True,
                    )
                )
            )
        )
        return project


@strawberry.type
class ProjectMembersQuery:

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def projectMembers(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> list[ProjectMemberType]:
        project = await sync_to_async(list)(
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project,
                is_active=True,
                member__is_bot=False,
            )
        )
        return project
