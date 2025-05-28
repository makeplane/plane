# Python imports
import json

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import IssueRelation, Workspace
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.helpers import (
    get_epic,
    get_project,
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
)
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.utils.roles import Roles


@strawberry.type
class EpicRelationMutation:
    # adding issue relation
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def add_epic_work_item_relation(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        relation_type: str,
        related_work_item_ids: list[str],
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = str(workspace.slug)
        workspace_id = str(workspace.id)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        # get the epic work items
        epic_details = await get_epic(
            workspace_slug=workspace_slug, project_id=project_id, epic_id=epic
        )
        epic_id = str(epic_details.id)

        issue_relations = [
            IssueRelation(
                issue_id=(
                    related_work_item_id if relation_type == "blocking" else epic_id
                ),
                related_issue_id=(
                    epic_id if relation_type == "blocking" else related_work_item_id
                ),
                relation_type=(
                    "blocked_by" if relation_type == "blocking" else relation_type
                ),
                project_id=project_id,
                workspace_id=workspace_id,
                created_by=user,
                updated_by=user,
            )
            for related_work_item_id in related_work_item_ids
        ]

        await sync_to_async(
            lambda: IssueRelation.objects.bulk_create(
                issue_relations, batch_size=10, ignore_conflicts=True
            )
        )()

        # Track the issue relation activity
        issue_activity.delay(
            type="issue_relation.activity.created",
            requested_data=json.dumps(
                {"issues": related_work_item_ids, "relation_type": relation_type}
            ),
            actor_id=user_id,
            issue_id=epic_id,
            project_id=project_id,
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return True
