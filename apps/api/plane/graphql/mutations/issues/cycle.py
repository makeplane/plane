# Python imports
import json
from typing import Optional

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone
from django.core import serializers

# Module imports
from plane.graphql.permissions.project import ProjectMemberPermission
from plane.db.models import Project, CycleIssue
from plane.graphql.bgtasks.issue_activity_task import issue_activity


@strawberry.type
class IssueCycleMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def issue_cycle(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        cycle: Optional[strawberry.ID] = None,
    ) -> bool:
        user = info.context.user
        project_details = await sync_to_async(Project.objects.get)(pk=project)

        existing_issue_cycle = await sync_to_async(
            lambda: list(
                CycleIssue.objects.filter(issue_id=issue).values_list(
                    "cycle_id", flat=True
                )
            )
        )()

        # Filter out existing issues
        existing_cycle_id = (
            str(existing_issue_cycle[0]) if len(existing_issue_cycle) > 0 else None
        )
        new_cycle_id = None
        removed_cycle_id = None

        if cycle:
            if existing_cycle_id is None:
                new_cycle_id = cycle
            elif existing_cycle_id and existing_cycle_id != cycle:
                new_cycle_id = cycle
                removed_cycle_id = existing_cycle_id
            elif existing_cycle_id and existing_cycle_id == cycle:
                return True
        else:
            if existing_cycle_id:
                removed_cycle_id = existing_cycle_id
            else:
                return True

        # remove module issues
        if removed_cycle_id:
            cycle_issue = await sync_to_async(CycleIssue.objects.filter)(
                workspace__slug=slug,
                project_id=project,
                issue_id=issue,
                cycle_id=removed_cycle_id,
            )

            await sync_to_async(issue_activity.delay)(
                type="cycle.activity.deleted",
                requested_data=json.dumps(
                    {"cycle_id": str(removed_cycle_id), "issues": [str(issue)]}
                ),
                actor_id=str(info.context.user.id),
                issue_id=str(issue),
                project_id=str(project),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

            await sync_to_async(lambda: cycle_issue.delete())()

        # create new cycle issue
        if new_cycle_id:
            created_cycle = await sync_to_async(CycleIssue.objects.create)(
                issue_id=issue,
                cycle_id=new_cycle_id,
                project_id=project_details.id,
                workspace_id=project_details.workspace_id,
                created_by_id=user.id,
                updated_by_id=user.id,
            )

            update_cycle_issue_activity = [
                {
                    "old_cycle_id": str(removed_cycle_id) if removed_cycle_id else None,
                    "new_cycle_id": str(cycle),
                    "issue_id": str(issue),
                }
            ]

            await sync_to_async(issue_activity.delay)(
                type="cycle.activity.created",
                requested_data=json.dumps({"cycles_list": list(issue)}),
                actor_id=str(info.context.user.id),
                issue_id=None,
                project_id=str(project),
                current_instance=json.dumps(
                    {
                        "updated_cycle_issues": update_cycle_issue_activity,
                        "created_cycle_issues": serializers.serialize(
                            "json", [created_cycle]
                        ),
                    }
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

        return True
