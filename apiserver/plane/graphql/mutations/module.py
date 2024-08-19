# Python imports
import json

# Strawberry imports
import strawberry
from strawberry.scalars import JSON
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone

# Module imports
from plane.graphql.permissions.project import (
    ProjectMemberPermission,
)
from plane.db.models import (
    Project,
    ModuleIssue,
)
from plane.graphql.bgtasks.issue_activity_task import issue_activity


@strawberry.type
class ModuleIssueMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[ProjectMemberPermission()])
        ]
    )
    async def create_module_issues(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
        issues: JSON,
    ) -> bool:
        project = await sync_to_async(Project.objects.get)(pk=project)
        # Create ModuleIssues asynchronously
        await sync_to_async(
            lambda: ModuleIssue.objects.bulk_create(
                [
                    ModuleIssue(
                        issue_id=issue_id,
                        module_id=module,
                        project_id=project.id,
                        workspace_id=project.workspace_id,
                        created_by_id=info.context.user.id,
                        updated_by_id=info.context.user.id,
                    )
                    for issue_id in issues
                ],
                batch_size=10,
                ignore_conflicts=True,
            )
        )()

        await sync_to_async(
            lambda: [
                issue_activity.delay(
                    type="module.activity.created",
                    requested_data=json.dumps({"module_id": str(module)}),
                    actor_id=str(info.context.user.id),
                    issue_id=str(issue),
                    project_id=str(project.id),
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=info.context.request.META.get("HTTP_ORIGIN"),
                )
                for issue in issues
            ]
        )()

        return True

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[ProjectMemberPermission()])
        ]
    )
    async def delete_module_issue(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
        issue: strawberry.ID,
    ) -> bool:
        module_issue = await sync_to_async(ModuleIssue.objects.filter)(
            module_id=module,
            project_id=project,
            workspace__slug=slug,
            issue_id=issue,
        )
        await sync_to_async(issue_activity.delay)(
            requested_data=json.dumps({"module_id": str(module)}),
            actor_id=str(info.context.user.id),
            issue_id=str(issue),
            project_id=str(project),
            current_instance=None,
            type="module.activity.deleted",
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        # Delete the module issue in a synchronous context
        await sync_to_async(module_issue.delete)()

        return True
