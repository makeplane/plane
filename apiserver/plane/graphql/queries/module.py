# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import Module, Issue
from plane.graphql.types.module import ModuleType
from plane.graphql.types.issue import IssueType
from plane.graphql.permissions.project import ProjectBasePermission


@strawberry.type
class ModuleQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def modules(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
    ) -> list[ModuleType]:

        modules = await sync_to_async(list)(
            Module.objects.filter(workspace__slug=slug)
            .filter(project_id=project)
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
        )
        return modules

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def module(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
    ) -> ModuleType:
        module = await sync_to_async(Module.objects.get)(
            workspace__slug=slug,
            project_id=project,
            id=module,
            project__project_projectmember__member=info.context.user,
            project__project_projectmember__is_active=True,
        )
        return module


@strawberry.type
class ModuleIssueQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def moduleIssues(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
    ) -> list[IssueType]:

        module_issues = await sync_to_async(list)(
            Issue.issue_objects.filter(workspace__slug=slug)
            .filter(project_id=project)
            .filter(issue_module__module_id=module)
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
        )
        return module_issues
