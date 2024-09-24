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
        module: Optional[strawberry.ID] = None,
        cycle: Optional[strawberry.ID] = None,
        issue: Optional[strawberry.ID] = None,
        relation_type: Optional[bool] = False,
        search: Optional[str] = None,
    ) -> list[IssueLiteType]:
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
            issue_queryset = issue_queryset.filter(
                issue_module__module_id=module
            )

        # cycle issues
        if cycle:
            issue_queryset = issue_queryset.filter(issue_cycle__cycle_id=cycle)

        # issue relation issues
        if relation_type and issue:
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

        return [IssueLiteType(**issue) for issue in issues]
