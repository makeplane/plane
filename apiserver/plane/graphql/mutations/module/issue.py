# Python imports
import json

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone

# Module imports
from plane.graphql.permissions.project import ProjectMemberPermission
from plane.db.models import Project, ModuleIssue
from plane.graphql.bgtasks.issue_activity_task import issue_activity


@strawberry.type
class ModuleIssueMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def create_module_issues(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
        issues: list[strawberry.ID],
    ) -> bool:
        user = info.context.user
        project = await sync_to_async(Project.objects.get)(pk=project)

        existing_module_issues = await sync_to_async(
            lambda: list(
                ModuleIssue.objects.filter(module_id=module).values_list(
                    "issue_id", flat=True
                )
            )
        )()

        # Filter out existing issues
        existing_issue_ids = set(str(issue_id) for issue_id in existing_module_issues)
        new_issue_ids = set(issues) - set(existing_issue_ids)
        remove_issue_ids = set(existing_issue_ids) - set(issues)

        if len(new_issue_ids) > 0:
            await sync_to_async(
                lambda: ModuleIssue.objects.bulk_create(
                    [
                        ModuleIssue(
                            issue_id=issue_id,
                            module_id=module,
                            project_id=project.id,
                            workspace_id=project.workspace_id,
                            created_by_id=user.id,
                            updated_by_id=user.id,
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
                        actor_id=str(user.id),
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

        if len(remove_issue_ids) > 0:
            module_issues = await sync_to_async(ModuleIssue.objects.filter)(
                workspace__slug=slug,
                project_id=project.id,
                module_id=module,
                issue_id__in=remove_issue_ids,
            )

            await sync_to_async(
                lambda: [
                    issue_activity.delay(
                        type="module.activity.deleted",
                        requested_data=json.dumps({"module_id": str(module)}),
                        actor_id=str(user.id),
                        issue_id=str(module_issue.issue_id),
                        project_id=str(project.id),
                        current_instance=json.dumps(
                            {"module_name": module_issue.module.name}
                        ),
                        epoch=int(timezone.now().timestamp()),
                        notification=True,
                        origin=info.context.request.META.get("HTTP_ORIGIN"),
                    )
                    for module_issue in module_issues
                ]
            )()

            await sync_to_async(module_issues.delete)()

        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def delete_module_issue(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
        issue: strawberry.ID,
    ) -> bool:
        user = info.context.user
        module_issue = await sync_to_async(ModuleIssue.objects.filter)(
            workspace__slug=slug, project_id=project, module_id=module, issue=issue
        )

        await sync_to_async(
            lambda: issue_activity.delay(
                requested_data=json.dumps({"module_id": str(module)}),
                actor_id=str(user.id),
                issue_id=str(issue),
                project_id=str(project),
                current_instance=json.dumps(
                    {"module_name": module_issue.first().module.name}
                ),
                type="module.activity.deleted",
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )
        )()

        # Delete the module issue in a synchronous context
        await sync_to_async(module_issue.delete)()

        return True
