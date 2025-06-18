# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.exceptions import GraphQLError

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
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task


@strawberry.type
class ProjectQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def all_projects(
        self, info: Info, slug: str, type: Optional[str] = "all"
    ) -> list[ProjectType]:
        project_query = Project.objects.filter(
            workspace__slug=slug, archived_at__isnull=True
        )

        if type == "joined":
            project_query = project_query.filter(
                Q(
                    project_projectmember__member=info.context.user,
                    project_projectmember__is_active=True,
                )
            )

        projects = await sync_to_async(list)(project_query)
        return projects

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def projects(
        self,
        info: Info,
        slug: str,
        type: Optional[str] = "all",
        cursor: Optional[str] = None,
        projects: Optional[JSON] = [],
    ) -> PaginatorResponse[ProjectType]:
        project_query = Project.objects.filter(
            workspace__slug=slug, archived_at__isnull=True
        )

        if len(projects) > 0:
            # Filter included and excluded projects
            included_projects_qs = project_query.filter(pk__in=projects)
            excluded_projects_qs = project_query.exclude(pk__in=projects)

            # Annotate the querysets
            included_projects_qs = included_projects_qs.annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=info.context.user,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                ),
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=info.context.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=slug,
                        is_active=True,
                    )
                ),
            )

            excluded_projects_qs = excluded_projects_qs.annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=info.context.user,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                ),
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=info.context.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=slug,
                        is_active=True,
                    )
                ),
            )

            # Convert querysets to lists
            included_projects_list = await sync_to_async(list)(included_projects_qs)
            excluded_projects_list = await sync_to_async(list)(excluded_projects_qs)

            # Combine the lists
            project_list = included_projects_list + excluded_projects_list
        else:
            project_query = project_query.annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=info.context.user,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                ),
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=info.context.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=slug,
                        is_active=True,
                    )
                ),
            )
            project_list = await sync_to_async(list)(project_query)

        if type == "created":
            project_list = await sync_to_async(list)(
                project_query.filter(created_by=info.context.user)
            )
        elif type == "joined":
            project_list = await sync_to_async(list)(
                project_query.filter(Q(is_member=True))
            )

        return paginate(results_object=project_list, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def project(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> Optional[ProjectType]:
        def get_project() -> Optional[ProjectType]:
            return (
                Project.objects.filter(
                    workspace__slug=slug,
                    pk=project,
                    archived_at__isnull=True,
                    deleted_at__isnull=True,
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

        try:
            _ = await sync_to_async(Project.objects.get)(pk=project)
            project_detail = await sync_to_async(get_project)()

            # Background task to update recent visited project
            user_id = info.context.user.id
            recent_visited_task.delay(
                slug=slug,
                project_id=project,
                user_id=user_id,
                entity_name="project",
                entity_identifier=project,
            )

            return project_detail
        except Project.DoesNotExist:
            message = "Project not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)


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
