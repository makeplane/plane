# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import Cycle, Issue
from plane.graphql.types.cycle import CycleType
from plane.graphql.types.issue import IssueType
from plane.graphql.permissions.project import ProjectBasePermission


@strawberry.type
class CycleQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycles(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
    ) -> list[CycleType]:

        cycles = await sync_to_async(list)(
            Cycle.objects.filter(workspace__slug=slug)
            .filter(project_id=project)
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
        )
        return cycles

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycle(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
    ) -> CycleType:
        cycle = await sync_to_async(Cycle.objects.get)(
            workspace__slug=slug,
            project_id=project,
            id=cycle,
            project__project_projectmember__member=info.context.user,
            project__project_projectmember__is_active=True,
        )
        return cycle


@strawberry.type
class CycleIssueQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycleIssues(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
    ) -> list[IssueType]:

        cycles_issues = await sync_to_async(list)(
            Issue.issue_objects.filter(workspace__slug=slug)
            .filter(project_id=project)
            .filter(issue_cycle__cycle_id=cycle)
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
        )
        return cycles_issues
