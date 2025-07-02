# Python Standard Library Imports
from enum import Enum
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Count, F

# Strawberry Imports
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import Issue
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces


# Enum for grouping issues
class IssuesGroupBy(Enum):
    PRIORITY = "priority"
    LABELS = "labels__id"
    STATE = "state__id"
    STATE_GROUP = "state__group"
    ASSIGNEES = "assignees__id"


# Function to execute the issue information query
async def issue_information_query_execute(
    user: strawberry.ID,
    slug: str,
    project: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    filters: Optional[JSON] = {},
    groupBy: Optional[str] = None,
    orderBy: Optional[str] = "-created_at",
):
    # Initialize variables
    order_by_group = None
    total_issues_count = 0
    group_by_info = None

    # Check if groupBy is not None
    if groupBy is not None:
        if groupBy == "priority":
            order_by_group = IssuesGroupBy.PRIORITY.value
        elif groupBy == "labels":
            order_by_group = IssuesGroupBy.LABELS.value
        elif groupBy == "state":
            order_by_group = IssuesGroupBy.STATE.value
        elif groupBy == "state_group":
            order_by_group = IssuesGroupBy.STATE_GROUP.value
        elif groupBy == "assignees":
            order_by_group = IssuesGroupBy.ASSIGNEES.value

    # Query the issues
    issue_query = Issue.objects.filter(workspace__slug=slug)

    # Filter the issues based on the project, cycle, and module
    if project is not None:
        issue_query = Issue.objects.filter(project_id=project)
    if cycle is not None:
        issue_query = issue_query.filter(issue_cycle__cycle_id=cycle)
    if module is not None:
        issue_query = issue_query.filter(issue_module__module_id=module)

    project_teamspace_filter = await project_member_filter_via_teamspaces(
        user_id=user,
        workspace_slug=slug,
    )
    issue_query = (
        issue_query.filter(project_teamspace_filter.query)
        .distinct()
        .filter(**filters)
        .order_by(orderBy, "-created_at")
    )

    # Get the count and group by information
    total_issues_count = await sync_to_async(issue_query.count)()
    if order_by_group is not None:
        group_by_info = await sync_to_async(list)(
            issue_query.values(order_by_group)
            .annotate(total_issues=Count(order_by_group))
            .order_by(F(order_by_group).asc(nulls_last=True))
            .values(groupKey=F(order_by_group), totalIssues=F("total_issues"))
        )
        group_by_info = [item for item in group_by_info if item["groupKey"] is not None]

    return total_issues_count, group_by_info
