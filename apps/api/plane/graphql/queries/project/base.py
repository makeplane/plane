# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python Imports
from typing import Optional, Union

# Third-Party Imports
import strawberry

# Django Imports
from asgiref.sync import sync_to_async
from django.db.models import Exists, OuterRef, Q, UUIDField

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import Project, ProjectMember, ProjectNetwork, UserFavorite
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task
from plane.graphql.helpers import (
    build_teamspace_project_access_filter_async,
    project_member_filter_via_teamspaces_async,
)
from plane.graphql.helpers.project import get_project
from plane.graphql.helpers.workspace import get_workspace_async
from plane.graphql.permissions.project import ProjectBasePermission, ProjectPermission
from plane.graphql.permissions.workspace import WorkspaceBasePermission, WorkspacePermission
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.types.project import ProjectMemberType, ProjectType, ProjectPublicLiteType
from plane.graphql.types.teamspace import TeamspaceProjectQueryPathEnum
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.roles import Roles


@sync_to_async
def get_project_details_async(
    user_id: Union[str, UUIDField], workspace_id: Union[str, UUIDField], project_id: Union[str, UUIDField]
) -> Optional[ProjectType]:
    try:
        project = (
            Project.objects.filter(pk=project_id, deleted_at__isnull=True)
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
                        workspace_id=workspace_id,
                        is_active=True,
                    )
                )
            )
            .first()
        )

        if not project:
            message = "Project not found."
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        if project.archived_at is not None:
            message = "Project is archived."
            error_extensions = {"code": "ARCHIVED", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        return project
    except Project.DoesNotExist:
        message = "Project not found."
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)
    except Exception as e:
        message = f"Something went wrong while fetching project details: {e}"
        error_extensions = {"code": "INTERNAL_SERVER_ERROR", "statusCode": 500}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class ProjectQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])])
    async def all_projects(self, info: Info, slug: str, type: Optional[str] = "all") -> list[ProjectType]:
        user = info.context.user
        user_id = str(user.id)

        workspace = await get_workspace_async(slug=slug)
        workspace_id = str(workspace.id)
        workspace_slug = workspace.slug

        project_query = Project.objects.filter(workspace_id=workspace_id, archived_at__isnull=True)

        project_teamspace_filter = await build_teamspace_project_access_filter_async(
            user_id=user_id,
            workspace_id=workspace_id,
            workspace_slug=workspace_slug,
            query_path=TeamspaceProjectQueryPathEnum.DIRECT,
        )
        if type == "joined":
            project_query = project_query.filter(project_teamspace_filter.query)

        projects = await sync_to_async(list)(project_query.distinct())
        return projects

    @strawberry.field(extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])])
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

        project_query = Project.objects.filter(workspace__slug=slug, archived_at__isnull=True)

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
            project_list = await sync_to_async(list)(project_query.filter(created_by_id=user_id))
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
                project_query.filter(Q(is_member=True) | Q(project_teamspace_filter.query)).distinct()
            )
            for project in project_list:
                project.is_member = True

        return paginate(results_object=project_list, cursor=cursor)

    @strawberry.field(extensions=[PermissionExtension(permissions=[ProjectPermission()])])
    async def project(self, info: Info, slug: str, project: strawberry.ID) -> Optional[ProjectType]:
        try:
            # fetching the user
            user = info.context.user
            user_id = str(user.id)

            # fetching the workspace
            workspace = await get_workspace_async(slug=slug)
            workspace_id = str(workspace.id)

            # fetching the project details
            project_detail = await get_project_details_async(
                user_id=user_id, workspace_id=workspace_id, project_id=project
            )

            # updating the recent visited project
            recent_visited_task.delay(
                slug=slug,
                project_id=project,
                user_id=user_id,
                entity_name="project",
                entity_identifier=project,
            )

            return project_detail
        except Exception as e:
            message = f"Something went wrong while fetching project: {e}"
            error_extensions = {"code": "INTERNAL_SERVER_ERROR", "statusCode": 500}
            raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class ProjectMembersQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[ProjectBasePermission()])])
    async def projectMembers(self, info: Info, slug: str, project: strawberry.ID) -> list[ProjectMemberType]:
        project_members = await sync_to_async(list)(
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project,
                is_active=True,
                member__is_bot=False,
            )
        )

        return project_members


@strawberry.type
class IsProjectPublicQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspacePermission(roles=[Roles.ADMIN, Roles.MEMBER, Roles.GUEST])])
        ]
    )
    async def is_project_public(self, info: Info, slug: str, project: strawberry.ID) -> Optional[ProjectPublicLiteType]:
        # fetching the workspace
        workspace = await get_workspace_async(slug=slug)
        workspace_slug = workspace.slug

        # fetching the project
        project = await get_project(workspace_slug=workspace_slug, project_id=str(project))

        if project.network == ProjectNetwork.PUBLIC.value:
            return project
        else:
            message = "Project is not public."
            error_extensions = {"code": "NOT_PUBLIC", "statusCode": 403}
            raise GraphQLError(message, extensions=error_extensions)
