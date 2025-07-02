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
class IssueModuleMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def issue_modules(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        modules: list[strawberry.ID],
    ) -> bool:
        user = info.context.user
        project_details = await sync_to_async(Project.objects.get)(pk=project)

        existing_issue_modules = await sync_to_async(
            lambda: list(
                ModuleIssue.objects.filter(issue_id=issue).values_list(
                    "module_id", flat=True
                )
            )
        )()

        # Filter out existing issues
        existing_module_ids = set(
            str(module_id) for module_id in existing_issue_modules
        )
        new_module_ids = set(modules) - set(existing_module_ids)
        removed_module_ids = set(existing_module_ids) - set(modules)

        new_module_ids = list(new_module_ids)
        removed_module_ids = list(removed_module_ids)

        # remove module issues
        if removed_module_ids and len(removed_module_ids) > 0:
            module_issues = await sync_to_async(ModuleIssue.objects.filter)(
                workspace__slug=slug,
                project_id=project_details.id,
                issue_id=issue,
                module_id__in=removed_module_ids,
            )

            await sync_to_async(
                lambda: [
                    issue_activity.delay(
                        type="module.activity.deleted",
                        requested_data=json.dumps({"module_id": str(module.id)}),
                        actor_id=str(user.id),
                        issue_id=str(issue),
                        project_id=str(project_details.id),
                        current_instance=json.dumps(
                            {"module_name": str(module.module.name)}
                        ),
                        epoch=int(timezone.now().timestamp()),
                        notification=True,
                        origin=info.context.request.META.get("HTTP_ORIGIN"),
                    )
                    for module in module_issues
                ]
            )()

            await sync_to_async(lambda: module_issues.delete())()

        # create new module issues
        if new_module_ids and len(new_module_ids) > 0:
            await sync_to_async(
                lambda: ModuleIssue.objects.bulk_create(
                    [
                        ModuleIssue(
                            issue_id=issue,
                            module_id=module_id,
                            project_id=project_details.id,
                            workspace_id=project_details.workspace_id,
                            created_by_id=user.id,
                            updated_by_id=user.id,
                        )
                        for module_id in new_module_ids
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            )()

            await sync_to_async(
                lambda: [
                    issue_activity.delay(
                        type="module.activity.created",
                        requested_data=json.dumps({"module_id": str(module_id)}),
                        actor_id=str(user.id),
                        issue_id=str(issue),
                        project_id=str(project_details.id),
                        current_instance=None,
                        epoch=int(timezone.now().timestamp()),
                        notification=True,
                        origin=info.context.request.META.get("HTTP_ORIGIN"),
                    )
                    for module_id in new_module_ids
                ]
            )()

        return True
