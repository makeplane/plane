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
    get_work_item_relation_type,
    is_timeline_dependency_feature_flagged_async,
)
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.utils.issue_activity import (
    convert_issue_relation_properties_to_activity_dict,
)
from plane.graphql.utils.roles import Roles
from plane.graphql.types.issues.relation import WorkItemRelationTypes


@strawberry.type
class IssueRelationMutation:
    # adding issue relation
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def addIssueRelation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        relation_type: str,
        related_issue_ids: list[strawberry.ID],
    ) -> bool:
        workspace_details = await sync_to_async(
            Workspace.objects.filter(slug=slug).first
        )()
        if not workspace_details:
            return False

        if relation_type in [
            WorkItemRelationTypes.START_AFTER.value,
            WorkItemRelationTypes.START_BEFORE.value,
            WorkItemRelationTypes.FINISH_AFTER.value,
            WorkItemRelationTypes.FINISH_BEFORE.value,
        ]:
            await is_timeline_dependency_feature_flagged_async(
                user_id=str(info.context.user.id),
                workspace_slug=slug,
            )

        issue_relations = [
            IssueRelation(
                issue_id=(
                    related_issue_id
                    if relation_type
                    in [
                        WorkItemRelationTypes.BLOCKING.value,
                        WorkItemRelationTypes.START_AFTER.value,
                        WorkItemRelationTypes.FINISH_AFTER.value,
                    ]
                    else issue
                ),
                related_issue_id=(
                    issue
                    if relation_type
                    in [
                        WorkItemRelationTypes.BLOCKING.value,
                        WorkItemRelationTypes.START_AFTER.value,
                        WorkItemRelationTypes.FINISH_AFTER.value,
                    ]
                    else related_issue_id
                ),
                relation_type=get_work_item_relation_type(relation_type),
                project_id=project,
                workspace_id=workspace_details.id,
                created_by=info.context.user,
                updated_by=info.context.user,
            )
            for related_issue_id in related_issue_ids
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
                {"issues": related_issue_ids, "relation_type": relation_type}
            ),
            actor_id=str(info.context.user.id),
            issue_id=str(issue),
            project_id=str(project),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return True

    # removing issue relation
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def removeIssueRelation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        relation_type: str,
        related_issue: strawberry.ID,
    ) -> bool:
        if relation_type in [
            WorkItemRelationTypes.START_AFTER.value,
            WorkItemRelationTypes.START_BEFORE.value,
            WorkItemRelationTypes.FINISH_AFTER.value,
            WorkItemRelationTypes.FINISH_BEFORE.value,
        ]:
            await is_timeline_dependency_feature_flagged_async(
                user_id=str(info.context.user.id),
                workspace_slug=slug,
            )

        issue_relation = await sync_to_async(
            lambda: IssueRelation.objects.get(
                workspace__slug=slug,
                project_id=project,
                issue_id=(
                    related_issue
                    if relation_type
                    in [
                        WorkItemRelationTypes.BLOCKING.value,
                        WorkItemRelationTypes.START_AFTER.value,
                        WorkItemRelationTypes.FINISH_AFTER.value,
                    ]
                    else issue
                ),
                related_issue_id=(
                    issue
                    if relation_type
                    in [
                        WorkItemRelationTypes.BLOCKING.value,
                        WorkItemRelationTypes.START_AFTER.value,
                        WorkItemRelationTypes.FINISH_AFTER.value,
                    ]
                    else related_issue
                ),
            )
        )()

        if not issue_relation:
            return False

        await sync_to_async(lambda: issue_relation.delete())()

        # current issue relation
        current_issue_relation_instance = (
            await convert_issue_relation_properties_to_activity_dict(issue_relation)
        )

        # Track the issue relation activity
        issue_activity.delay(
            type="issue_relation.activity.deleted",
            requested_data=json.dumps(
                {"related_issue": related_issue, "relation_type": relation_type}
            ),
            actor_id=str(info.context.user.id),
            issue_id=str(issue),
            project_id=str(project),
            current_instance=json.dumps(current_issue_relation_instance),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return True
