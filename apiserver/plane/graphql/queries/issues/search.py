# Python imports
import re

# Third-Party Imports
import strawberry

from typing import Optional

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.db.models import Issue
from plane.graphql.types.issue import IssueLiteType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


@sync_to_async
def get_issue_details(issue_id):
    issue = Issue.objects.get(id=issue_id)
    return issue


@strawberry.type
class IssuesSearchQuery:
    # getting issues which are not related
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )

    # getting issue relation issues
    async def issuesSearch(
        self,
        info: Info,
        slug: str,
        project: Optional[strawberry.ID] = None,
        issue: Optional[strawberry.ID] = None,
        module: Optional[strawberry.ID] = False,
        cycle: Optional[bool] = False,
        relationType: Optional[bool] = False,
        subIssues: Optional[bool] = False,
        search: Optional[str] = None,
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[IssueLiteType]:
        issue_queryset = Issue.issue_objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=info.context.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )

        # workspace issues
        if project:
            issue_queryset = issue_queryset.filter(project_id=project)

        # module issues
        if module:
            issue_queryset = issue_queryset.exclude(
                issue_module__module=module
            )

        # cycle issues
        if cycle:
            issue_queryset = issue_queryset.exclude(issue_cycle__isnull=False)

        # issue relation issues
        if relationType and issue:
            issue_queryset = issue_queryset.filter(
                ~Q(pk=issue),
                ~Q(
                    issue_related__issue=issue,
                    issue_related__deleted_at__isnull=True,
                ),
                ~Q(
                    issue_relation__related_issue=issue,
                    issue_related__deleted_at__isnull=True,
                ),
            )

        # sub issues
        if subIssues and issue:
            current_issue = await get_issue_details(issue)
            issue_queryset = issue_queryset.filter(
                Q(parent__isnull=True), ~Q(pk=issue)
            )
            if current_issue.parent_id:
                issue_queryset = issue_queryset.filter(
                    ~Q(pk=current_issue.parent_id)
                )

        # apply search filter
        q = Q()
        if search:
            fields = ["name", "sequence_id", "project__identifier"]
            for field in fields:
                if field == "sequence_id":
                    # Match whole integers only (exclude decimal numbers)
                    sequences = re.findall(r"\b\d+\b", search)
                    for sequence_id in sequences:
                        q |= Q(**{"sequence_id": sequence_id})
                else:
                    q |= Q(**{f"{field}__icontains": search})

        issues = await sync_to_async(
            lambda: list(
                issue_queryset.filter(q)
                .distinct()
                .values(
                    "id",
                    "sequence_id",
                    "name",
                    "project",
                    "project__identifier",
                )
            )
        )()

        for issue in issues:
            issue["project_identifier"] = issue["project__identifier"]
            del issue["project__identifier"]

        listed_issues: list[IssueLiteType] = [
            IssueLiteType(**issue) for issue in issues
        ]

        return paginate(results_object=listed_issues, cursor=cursor)
