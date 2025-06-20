# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import CharField, Q, Value

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import IssueRelation
from plane.graphql.helpers import work_item_base_query
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.issues.relation import IssueRelationType


@strawberry.type
class IssueRelationQuery:
    # getting issue relation issues
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issueRelation(
        self, info: Info, slug: str, project: strawberry.ID, issue: strawberry.ID
    ) -> IssueRelationType:
        user = info.context.user
        user_id = str(user.id)

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        # construct the issue relation query
        issue_relation_query = (
            IssueRelation.objects.filter(workspace__slug=slug)
            .filter(project__id=project)
            .filter(deleted_at__isnull=True)
            .filter(project_teamspace_filter.query)
            .distinct()
            .filter(Q(issue_id=issue) | Q(related_issue=issue))
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .order_by("-created_at")
            .distinct()
        )

        # getting all blocking issues
        blocking_issue_ids = await sync_to_async(list)(
            issue_relation_query.filter(
                relation_type="blocked_by", related_issue_id=issue
            ).values_list("issue_id", flat=True)
        )

        # getting all blocked by issues
        blocked_by_issue_ids = await sync_to_async(list)(
            issue_relation_query.filter(
                relation_type="blocked_by", issue_id=issue
            ).values_list("related_issue_id", flat=True)
        )

        # constructing the issue query
        issue_queryset = (
            work_item_base_query(workspace_slug=slug)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .filter(archived_at__isnull=True)
            .filter(deleted_at__isnull=True)
        )

        # getting all blocking issues
        blocking_issues = await sync_to_async(list)(
            issue_queryset.filter(id__in=blocking_issue_ids).annotate(
                relation_type=Value("blocking", output_field=CharField())
            )
        )

        # getting all blocked by issues
        blocked_by_issues = await sync_to_async(list)(
            issue_queryset.filter(id__in=blocked_by_issue_ids).annotate(
                relation_type=Value("blocked_by", output_field=CharField())
            )
        )

        relation_response = IssueRelationType(
            blocking=blocking_issues, blocked_by=blocked_by_issues
        )

        return relation_response
