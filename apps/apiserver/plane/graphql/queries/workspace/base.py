# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Issue, Page, Project, Workspace, WorkspaceMember
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import IsAuthenticated, WorkspaceBasePermission
from plane.graphql.types.workspace import (
    WorkspaceMemberType,
    WorkspaceType,
    WorkspaceYourWorkType,
)
from plane.graphql.utils.work_item_filters import work_item_filters


@strawberry.type
class YourWorkQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def yourWork(self, info: Info, slug: str) -> WorkspaceYourWorkType:
        user = info.context.user
        user_id = str(user.id)

        # projects
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
        projects = await sync_to_async(list)(
            Project.objects.filter(workspace__slug=slug, archived_at__isnull=True)
            .filter(project_teamspace_filter.query)
            .distinct()
            .values_list("id", flat=True)
            .distinct()
        )

        # issues
        issue_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id, workspace_slug=slug
        )
        filters = {"assignees": [user_id]}
        filters = work_item_filters(filters)
        issues = await sync_to_async(list)(
            Issue.issue_objects.filter(workspace__slug=slug)
            .filter(issue_teamspace_filter.query)
            .distinct()
            .filter(**filters)
            .values_list("id", flat=True)
            .distinct()
        )

        # pages
        page_project_member_base_query = {
            "projects__project_projectmember__member_id": user_id,
            "projects__project_projectmember__is_active": True,
            "projects__archived_at__isnull": True,
        }
        page_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
            related_field="projects__id",
            query=page_project_member_base_query,
        )
        pages = await sync_to_async(list)(
            Page.objects.filter(workspace__slug=slug)
            .filter(owned_by_id=user_id)
            .filter(parent__isnull=True)
            .filter(moved_to_page__isnull=True)
            .filter(is_global=False)
            .filter(archived_at__isnull=True)
            .filter(page_teamspace_filter.query)
            .distinct()
            .values_list("id", flat=True)
        )

        your_work = WorkspaceYourWorkType(
            projects=len(projects), issues=len(issues), pages=len(pages)
        )

        return your_work


@strawberry.type
class WorkspaceQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[IsAuthenticated()])])
    async def workspaces(self, info: Info) -> list[WorkspaceType]:
        user = info.context.user
        user_id = str(user.id)

        workspaces = await sync_to_async(list)(
            Workspace.objects.filter(
                workspace_member__member_id=user_id,
                workspace_member__is_active=True,
            ).order_by("-created_at")
        )

        return workspaces


@strawberry.type
class WorkspaceMembersQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspaceMembers(
        self, info: Info, slug: str
    ) -> list[WorkspaceMemberType]:
        workspace_members = await sync_to_async(list)(
            WorkspaceMember.objects.filter(
                workspace__slug=slug, is_active=True, member__is_bot=False
            )
        )
        return workspace_members
