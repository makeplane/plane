# Python Imports
from typing import Optional

# Third-Party Imports
import strawberry

# Django Imports
from asgiref.sync import sync_to_async
from django.db.models import Exists, OuterRef, Q

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import Project, ProjectMember, UserFavorite
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task
from plane.graphql.helpers import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.types.project import ProjectMemberType, ProjectType
from plane.graphql.utils.paginator import paginate


@strawberry.type
class ProjectQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def all_projects(
        self, info: Info, slug: str, type: Optional[str] = "all"
    ) -> list[ProjectType]:
        user = info.context.user
        user_id = str(user.id)

        project_query = Project.objects.filter(
            workspace__slug=slug, archived_at__isnull=True
        )

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
            related_field="id",
            query={
                "project_projectmember__member_id": user_id,
                "project_projectmember__is_active": True,
                "archived_at__isnull": True,
            },
        )
        if type == "joined":
            project_query = project_query.filter(project_teamspace_filter.query)

        projects = await sync_to_async(list)(project_query.distinct())
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
        user = info.context.user
        user_id = str(user.id)

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
                        user_id=user_id,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                ),
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member_id=user_id,
                        project_id=OuterRef("pk"),
                        workspace__slug=slug,
                        is_active=True,
                    )
                ),
            )

            excluded_projects_qs = excluded_projects_qs.annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user_id=user_id,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                ),
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member_id=user_id,
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
                        user_id=user_id,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                ),
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member_id=user_id,
                        project_id=OuterRef("pk"),
                        workspace__slug=slug,
                        is_active=True,
                    )
                ),
            )
            project_list = await sync_to_async(list)(project_query)

        if type == "created":
            project_list = await sync_to_async(list)(
                project_query.filter(created_by_id=user_id)
            )
        elif type == "joined":
            project_teamspace_filter = await project_member_filter_via_teamspaces_async(
                user_id=user_id,
                workspace_slug=slug,
                related_field="id",
                query={
                    "project_projectmember__member_id": user_id,
                    "project_projectmember__is_active": True,
                    "archived_at__isnull": True,
                },
            )
            project_list = await sync_to_async(list)(
                project_query.filter(
                    Q(is_member=True) | Q(project_teamspace_filter.query)
                ).distinct()
            )
            for project in project_list:
                project.is_member = True

        return paginate(results_object=project_list, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def project(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> Optional[ProjectType]:
        user = info.context.user
        user_id = str(user.id)

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
                            user_id=user_id,
                            entity_identifier=OuterRef("pk"),
                            entity_type="project",
                            project_id=OuterRef("pk"),
                        )
                    )
                )
                .annotate(
                    is_member=Exists(
                        ProjectMember.objects.filter(
                            member_id=user_id,
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
