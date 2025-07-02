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
    is_timeline_dependency_feature_flagged_async,
    work_item_base_query,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.epics.relation import EpicRelationType
from plane.graphql.types.issues.relation import WorkItemRelationTypes


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

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=workspace_slug,
        )
        epic_work_item_relation_query = (
            IssueRelation.objects.filter(workspace__slug=workspace_slug)
            .filter(deleted_at__isnull=True)
            .filter(project_teamspace_filter.query)
            .distinct()
            .filter(Q(issue_id=epic_id) | Q(related_issue_id=epic_id))
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .order_by("-created_at")
            .distinct()
        )

        timeline_dependency_feature_flagged = (
            await is_timeline_dependency_feature_flagged_async(
                user_id=user_id,
                workspace_slug=slug,
                raise_exception=False,
            )
        )

        # getting all blocking work item ids
        blocking_work_item_ids = await sync_to_async(list)(
            epic_work_item_relation_query.filter(
                relation_type=WorkItemRelationTypes.BLOCKED_BY.value,
                related_issue_id=epic_id,
            ).values_list("issue_id", flat=True)
        )

        # getting all blocked by work item ids
        blocked_by_work_item_ids = await sync_to_async(list)(
            epic_work_item_relation_query.filter(
                relation_type=WorkItemRelationTypes.BLOCKED_BY.value,
                issue_id=epic_id,
            ).values_list("related_issue_id", flat=True)
        )

        # getting all duplicate of work item ids
        duplicate_of_work_item_ids = await sync_to_async(list)(
            epic_work_item_relation_query.filter(
                relation_type=WorkItemRelationTypes.DUPLICATE.value,
                issue_id=epic_id,
            ).values_list("related_issue_id", flat=True)
        )

        # getting all related duplicate of work item ids
        duplicate_of_work_item_ids_related = await sync_to_async(list)(
            epic_work_item_relation_query.filter(
                relation_type=WorkItemRelationTypes.DUPLICATE.value,
                related_issue_id=epic_id,
            ).values_list("issue_id", flat=True)
        )

        duplicate_work_item_ids = list(
            set(
                duplicate_of_work_item_ids
                or [] + duplicate_of_work_item_ids_related
                or []
            )
        )

        # getting all relates to work item ids
        relates_to_work_item_ids = await sync_to_async(list)(
            epic_work_item_relation_query.filter(
                relation_type=WorkItemRelationTypes.RELATES_TO.value,
                issue_id=epic_id,
            ).values_list("related_issue_id", flat=True)
        )

        # getting all related relates to work item ids
        relates_to_work_item_ids_related = await sync_to_async(list)(
            epic_work_item_relation_query.filter(
                relation_type=WorkItemRelationTypes.RELATES_TO.value,
                related_issue_id=epic_id,
            ).values_list("issue_id", flat=True)
        )

        relates_work_item_ids = list(
            set(relates_to_work_item_ids or [] + relates_to_work_item_ids_related or [])
        )

        if timeline_dependency_feature_flagged is False:
            start_after_work_item_ids = []
            start_before_work_item_ids = []
            finish_after_work_item_ids = []
            finish_before_work_item_ids = []
        else:
            # getting all start after work item ids
            start_after_work_item_ids = await sync_to_async(list)(
                epic_work_item_relation_query.filter(
                    relation_type=WorkItemRelationTypes.START_BEFORE.value,
                    related_issue_id=epic_id,
                ).values_list("issue_id", flat=True)
            )

            # getting all start before work item ids
            start_before_work_item_ids = await sync_to_async(list)(
                epic_work_item_relation_query.filter(
                    relation_type=WorkItemRelationTypes.START_BEFORE.value,
                    issue_id=epic_id,
                ).values_list("related_issue_id", flat=True)
            )

            # getting all finish after work item ids
            finish_after_work_item_ids = await sync_to_async(list)(
                epic_work_item_relation_query.filter(
                    relation_type=WorkItemRelationTypes.FINISH_BEFORE.value,
                    related_issue_id=epic_id,
                ).values_list("issue_id", flat=True)
            )

            # getting all finish before work item ids
            finish_before_work_item_ids = await sync_to_async(list)(
                epic_work_item_relation_query.filter(
                    relation_type=WorkItemRelationTypes.FINISH_BEFORE.value,
                    issue_id=epic_id,
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
        if len(blocking_work_item_ids) <= 0:
            blocking_work_items = []
        else:
            blocking_work_items = await sync_to_async(list)(
                work_item_queryset.filter(id__in=blocking_work_item_ids).annotate(
                    relation_type=Value(
                        WorkItemRelationTypes.BLOCKING.value, output_field=CharField()
                    )
                )
            )

        # getting all blocked by work items
        if len(blocked_by_work_item_ids) <= 0:
            blocked_by_work_items = []
        else:
            blocked_by_work_items = await sync_to_async(list)(
                work_item_queryset.filter(id__in=blocked_by_work_item_ids).annotate(
                    relation_type=Value(
                        WorkItemRelationTypes.BLOCKED_BY.value, output_field=CharField()
                    )
                )
            )

        # getting all duplicate of work items
        if len(duplicate_work_item_ids) <= 0:
            duplicate_work_items = []
        else:
            duplicate_work_items = await sync_to_async(list)(
                work_item_queryset.filter(id__in=duplicate_work_item_ids).annotate(
                    relation_type=Value(
                        WorkItemRelationTypes.DUPLICATE.value, output_field=CharField()
                    )
                )
            )

        # getting all relates to work items
        if len(relates_work_item_ids) <= 0:
            relates_to_work_items = []
        else:
            relates_to_work_items = await sync_to_async(list)(
                work_item_queryset.filter(id__in=relates_work_item_ids).annotate(
                    relation_type=Value(
                        WorkItemRelationTypes.RELATES_TO.value, output_field=CharField()
                    )
                )
            )

        # getting all start after work items
        if len(start_after_work_item_ids) <= 0:
            start_after_work_items = []
        else:
            start_after_work_items = await sync_to_async(list)(
                work_item_queryset.filter(id__in=start_after_work_item_ids).annotate(
                    relation_type=Value(
                        WorkItemRelationTypes.START_AFTER.value,
                        output_field=CharField(),
                    )
                )
            )

        # getting all start before work items
        if len(start_before_work_item_ids) <= 0:
            start_before_work_items = []
        else:
            start_before_work_items = await sync_to_async(list)(
                work_item_queryset.filter(id__in=start_before_work_item_ids).annotate(
                    relation_type=Value(
                        WorkItemRelationTypes.START_BEFORE.value,
                        output_field=CharField(),
                    )
                )
            )

        # getting all finish after work items
        if len(finish_after_work_item_ids) <= 0:
            finish_after_work_items = []
        else:
            finish_after_work_items = await sync_to_async(list)(
                work_item_queryset.filter(id__in=finish_after_work_item_ids).annotate(
                    relation_type=Value(
                        WorkItemRelationTypes.FINISH_AFTER.value,
                        output_field=CharField(),
                    )
                )
            )

        # getting all finish before work items
        if len(finish_before_work_item_ids) <= 0:
            finish_before_work_items = []
        else:
            finish_before_work_items = await sync_to_async(list)(
                work_item_queryset.filter(id__in=finish_before_work_item_ids).annotate(
                    relation_type=Value(
                        WorkItemRelationTypes.FINISH_BEFORE.value,
                        output_field=CharField(),
                    )
                )
            )

        relation_response = EpicRelationType(
            blocking=blocking_work_items,
            blocked_by=blocked_by_work_items,
            duplicate=duplicate_work_items,
            relates_to=relates_to_work_items,
            start_after=start_after_work_items,
            start_before=start_before_work_items,
            finish_after=finish_after_work_items,
            finish_before=finish_before_work_items,
        )

        return relation_response
