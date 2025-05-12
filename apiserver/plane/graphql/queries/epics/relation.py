# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import CharField, Q, Value

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import IssueRelation
from plane.graphql.helpers import (
    get_epic,
    get_project,
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
    work_item_base_query,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.epics.relation import EpicRelationType


@strawberry.type
class EpicRelationQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic_relation(
        self, info: Info, slug: str, project: str, epic: str
    ) -> EpicRelationType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = str(workspace.slug)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        # get the epic work items
        epic_details = await get_epic(
            workspace_slug=workspace_slug, project_id=project_id, epic_id=epic
        )
        epic_id = str(epic_details.id)

        epic_work_item_relation_query = (
            IssueRelation.objects.filter(workspace__slug=workspace_slug)
            .filter(project__id=project_id)
            .filter(deleted_at__isnull=True)
            .filter(
                project__project_projectmember__member_id=user_id,
                project__project_projectmember__is_active=True,
            )
            .filter(Q(issue_id=epic_id) | Q(related_issue=epic_id))
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .order_by("-created_at")
            .distinct()
        )

        # getting all blocking work items
        blocking_work_item_ids = await sync_to_async(list)(
            epic_work_item_relation_query.filter(
                relation_type="blocked_by", related_issue_id=epic_id
            ).values_list("issue_id", flat=True)
        )

        # getting all blocked by work items
        blocked_by_work_item_ids = await sync_to_async(list)(
            epic_work_item_relation_query.filter(
                relation_type="blocked_by", issue_id=epic_id
            ).values_list("related_issue_id", flat=True)
        )

        # constructing the work item query
        work_item_queryset = (
            work_item_base_query(workspace_slug=slug)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .filter(archived_at__isnull=True)
            .filter(deleted_at__isnull=True)
        )

        # getting all blocking work items
        blocking_work_items = await sync_to_async(list)(
            work_item_queryset.filter(id__in=blocking_work_item_ids).annotate(
                relation_type=Value("blocking", output_field=CharField())
            )
        )

        # getting all blocked by work items
        blocked_by_work_items = await sync_to_async(list)(
            work_item_queryset.filter(id__in=blocked_by_work_item_ids).annotate(
                relation_type=Value("blocked_by", output_field=CharField())
            )
        )

        relation_response = EpicRelationType(
            blocking=blocking_work_items, blocked_by=blocked_by_work_items
        )

        return relation_response
