# Python imports
import json

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Django imports
from django.db.models import Q
from django.utils import timezone
from django.core import serializers

# Module imports
from plane.graphql.permissions.project import ProjectMemberPermission
from plane.db.models import CycleIssue, Cycle
from plane.graphql.bgtasks.issue_activity_task import issue_activity


@strawberry.type
class CycleIssueMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def create_cycle_issue(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
        issues: JSON,
    ) -> bool:
        # Fetch the cycle object asynchronously
        cycle = await sync_to_async(Cycle.objects.get)(
            workspace__slug=slug, project_id=project, pk=cycle
        )

        # Fetch existing CycleIssues for the given issues asynchronously
        existing_cycle_issues = await sync_to_async(
            lambda: list(
                CycleIssue.objects.filter(~Q(cycle_id=cycle), issue_id__in=issues).all()
            )
        )()

        # Extract issue_ids from the existing CycleIssue objects
        existing_issue_ids = set(
            map(lambda ci: str(ci.issue_id), existing_cycle_issues)
        )

        # Convert issues to a set of strings
        new_issue_ids = set(map(str, issues))

        # Determine new issues to create
        new_issue_ids -= existing_issue_ids

        # Update existing CycleIssues to the new cycle asynchronously
        await sync_to_async(
            lambda: CycleIssue.objects.filter(
                ~Q(cycle=cycle), issue_id__in=existing_issue_ids
            ).update(cycle=cycle)
        )()

        # Create new CycleIssues for new issues
        new_cycle_issues = [
            CycleIssue(
                project_id=project,
                workspace_id=cycle.workspace_id,
                created_by_id=info.context.user.id,
                updated_by_id=info.context.user.id,
                cycle=cycle,
                issue_id=issue_id,
            )
            for issue_id in new_issue_ids
        ]
        created_records = await sync_to_async(CycleIssue.objects.bulk_create)(
            new_cycle_issues, batch_size=10
        )

        update_cycle_issue_activity = [
            {
                "old_cycle_id": str(cycle_issue.cycle_id),
                "new_cycle_id": str(cycle.id),
                "issue_id": str(cycle_issue.issue_id),
            }
            for cycle_issue in existing_cycle_issues
        ]

        # Capture Issue Activity asynchronously
        await sync_to_async(issue_activity.delay)(
            type="cycle.activity.created",
            requested_data=json.dumps({"cycles_list": list(issues)}),
            actor_id=str(info.context.user.id),
            issue_id=None,
            project_id=str(project),
            current_instance=json.dumps(
                {
                    "updated_cycle_issues": update_cycle_issue_activity,
                    "created_cycle_issues": serializers.serialize(
                        "json", created_records
                    ),
                }
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def delete_cycle_issue(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
        issue: strawberry.ID,
    ) -> bool:
        cycle_issue = await sync_to_async(CycleIssue.objects.filter)(
            cycle_id=cycle, project_id=project, workspace__slug=slug, issue_id=issue
        )
        await sync_to_async(issue_activity.delay)(
            type="cycle.activity.deleted",
            requested_data=json.dumps({"cycle_id": str(cycle), "issues": [str(issue)]}),
            actor_id=str(info.context.user.id),
            issue_id=str(issue),
            project_id=str(project),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )
        await sync_to_async(cycle_issue.delete)()

        return True
