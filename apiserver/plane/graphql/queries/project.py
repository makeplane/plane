# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Exists, OuterRef, Q
from typing import Optional

# Module Imports
from plane.graphql.types.project import ProjectType, ProjectMemberType
from plane.db.models import Project, ProjectMember, UserFavorite
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


@strawberry.type
class ProjectQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def projects(
        self,
        info: Info,
        slug: str,
        type: Optional[str] = "all",
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[ProjectType]:
        project_query = Project.objects.filter(
            workspace__slug=slug, archived_at__isnull=True
        )

        if type == "created":
            project_query = project_query.filter(created_by=info.context.user)
        elif type == "joined":
            project_query = project_query.filter(
                Q(
                    project_projectmember__member=info.context.user,
                    project_projectmember__is_active=True,
                )
            )

        project = await sync_to_async(list)(
            project_query.annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=info.context.user,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                )
            ).annotate(
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

        return paginate(results_object=project, cursor=cursor)

    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def project(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
    ) -> Optional[ProjectType]:
        def get_project() -> Optional[ProjectType]:
            return (
                Project.objects.filter(
                    workspace__slug=slug,
                    pk=project,
                    archived_at__isnull=True,
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
                .first()
            )

        project = await sync_to_async(get_project)()
        return project


@strawberry.type
class ProjectMembersQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def projectMembers(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> list[ProjectMemberType]:
        project_members = await sync_to_async(list)(
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project,
                is_active=True,
                member__is_bot=False,
            )
        )

        return project_members
