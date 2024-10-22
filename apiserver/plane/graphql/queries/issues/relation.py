# Third-Party Imports
import strawberry


# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q, Value, CharField

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.graphql.permissions.project import ProjectBasePermission
from plane.db.models import IssueRelation, Issue
from plane.graphql.types.issues.relation import IssueRelationType


@strawberry.type
class IssueRelationQuery:
    # getting issue relation issues
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def issueRelation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> IssueRelationType:
        # construct the issue relation query
        issue_relation_query = (
            IssueRelation.objects.filter(workspace__slug=slug)
            .filter(project__id=project)
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
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
            Issue.issue_objects.filter(
                workspace__slug=slug, project_id=project
            )
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
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
            blocking=blocking_issues,
            blocked_by=blocked_by_issues,
        )

        return relation_response
