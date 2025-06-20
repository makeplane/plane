# Python imports
import re
from typing import Optional

# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Issue
from plane.graphql.helpers import is_epic_feature_flagged, is_project_epics_enabled
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.issues.base import IssueLiteType
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
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
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
        is_epic_related: Optional[bool] = False,
    ) -> PaginatorResponse[IssueLiteType]:
        user = info.context.user
        user_id = str(user.id)

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        issue_queryset = (
            Issue.objects.filter(workspace__slug=slug)
            # issue intake filters
            .filter(
                Q(issue_intake__status=1)
                | Q(issue_intake__status=-1)
                | Q(issue_intake__status=2)
                | Q(issue_intake__isnull=True)
            )
            # old intake filters
            .filter(state__is_triage=False)
            # archived filters
            .filter(archived_at__isnull=True)
            # deleted filters
            .filter(deleted_at__isnull=True)
            # draft filters
            .filter(is_draft=False)
            .filter(project_teamspace_filter.query)
        )

        # epic filters
        is_epics_required = False
        epic_feature_flagged = False
        epic_project_enabled = False
        if is_epic_related:
            epic_feature_flagged = await is_epic_feature_flagged(
                user_id=user_id, workspace_slug=slug, raise_exception=False
            )
            if epic_feature_flagged:
                epic_project_enabled = await is_project_epics_enabled(
                    workspace_slug=slug, project_id=project, raise_exception=False
                )
                if epic_project_enabled:
                    is_epics_required = True

        if is_epics_required is False:
            issue_queryset = issue_queryset.filter(
                Q(type__is_epic=False) | Q(type__isnull=True)
            )

        # workspace issues
        if project:
            issue_queryset = issue_queryset.filter(project_id=project)

        # module issues
        if module:
            issue_queryset = issue_queryset.exclude(issue_module__module=module)

        # cycle issues
        if cycle:
            issue_queryset = issue_queryset.exclude(issue_cycle__isnull=False)

        # issue relation issues
        if relationType and issue:
            issue_queryset = issue_queryset.filter(
                ~Q(pk=issue),
                ~Q(issue_related__issue=issue, issue_related__deleted_at__isnull=True),
                ~Q(
                    issue_relation__related_issue=issue,
                    issue_related__deleted_at__isnull=True,
                ),
            )

        # sub issues
        if subIssues and issue:
            current_issue = await get_issue_details(issue)
            issue_queryset = issue_queryset.filter(Q(parent__isnull=True), ~Q(pk=issue))
            if current_issue.parent_id:
                issue_queryset = issue_queryset.filter(~Q(pk=current_issue.parent_id))

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
                    "type__is_epic",
                )
            )
        )()

        for issue in issues:
            issue["project_identifier"] = issue["project__identifier"]
            del issue["project__identifier"]

            issue["is_epic"] = issue["type__is_epic"] and epic_project_enabled or False
            del issue["type__is_epic"]

        listed_issues: list[IssueLiteType] = [
            IssueLiteType(**issue) for issue in issues
        ]

        return paginate(results_object=listed_issues, cursor=cursor)
