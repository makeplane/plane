# Python imports
from typing import Optional

# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.utils import timezone
from django.db.models import Q

# Strawberry Imports
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import Cycle, Issue, CycleUserProperties
from plane.graphql.types.cycle import CycleType, CycleUserPropertyType
from plane.graphql.types.issue import (
    IssuesInformationType,
    IssuesInformationObjectType,
    IssuesType,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.issue_filters import issue_filters
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.issue import issue_information_query_execute


@strawberry.type
class CycleQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycles(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
    ) -> list[CycleType]:
        # get cycles those are current and upcoming cycles based on the start_date and end_date
        cycles = await sync_to_async(list)(
            Cycle.objects.filter(workspace__slug=slug, project_id=project)
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
            .filter(
                Q(start_date__isnull=True, end_date__isnull=True)
                | Q(
                    start_date__lte=timezone.now().date(),
                    end_date__gte=timezone.now().date(),
                )
                | (
                    Q(start_date__isnull=False)
                    & Q(start_date__gte=timezone.now().date())
                )
            )
            .order_by("start_date")
        )
        return cycles

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycle(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
    ) -> CycleType:
        cycle = await sync_to_async(Cycle.objects.get)(
            workspace__slug=slug,
            project_id=project,
            id=cycle,
            project__project_projectmember__member=info.context.user,
            project__project_projectmember__is_active=True,
        )
        return cycle


# cycle issue user properties
@strawberry.type
class CycleIssueUserPropertyQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycleIssueUserProperties(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
    ) -> CycleUserPropertyType:
        def get_cycle_issue_user_property():
            cycle_properties, _ = CycleUserProperties.objects.get_or_create(
                workspace__slug=slug,
                project_id=project,
                cycle_id=cycle,
                user=info.context.user,
            )
            return cycle_properties

        cycle_issue_property = await sync_to_async(
            lambda: get_cycle_issue_user_property()
        )()

        return cycle_issue_property


# cycle issues information query
@strawberry.type
class CycleIssuesInformationQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycleIssuesInformation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
        filters: Optional[JSON] = {},
        groupBy: Optional[str] = None,
        orderBy: Optional[str] = "-created_at",
    ) -> IssuesInformationType:
        filters = issue_filters(filters, "POST")

        # all issues tab information
        (
            all_issue_count,
            all_issue_group_info,
        ) = await issue_information_query_execute(
            user=info.context.user,
            slug=slug,
            project=project,
            cycle=cycle,
            filters=filters,
            groupBy=groupBy,
            orderBy=orderBy,
        )

        # active issues tab information
        filters["state__group__in"] = ["unstarted", "started"]
        (
            active_issue_count,
            active_issue_group_info,
        ) = await issue_information_query_execute(
            user=info.context.user,
            slug=slug,
            project=project,
            cycle=cycle,
            filters=filters,
            groupBy=groupBy,
            orderBy=orderBy,
        )

        # backlog issues tab information
        filters["state__group__in"] = ["backlog"]
        (
            backlog_issue_count,
            backlog_issue_group_info,
        ) = await issue_information_query_execute(
            user=info.context.user,
            slug=slug,
            project=project,
            cycle=cycle,
            filters=filters,
            groupBy=groupBy,
            orderBy=orderBy,
        )

        issue_information = IssuesInformationType(
            all=IssuesInformationObjectType(
                totalIssues=all_issue_count, groupInfo=all_issue_group_info
            ),
            active=IssuesInformationObjectType(
                totalIssues=active_issue_count,
                groupInfo=active_issue_group_info,
            ),
            backlog=IssuesInformationObjectType(
                totalIssues=backlog_issue_count,
                groupInfo=backlog_issue_group_info,
            ),
        )

        return issue_information


# cycle issues
@strawberry.type
class CycleIssueQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycleIssues(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
        filters: Optional[JSON] = {},
        orderBy: Optional[str] = "-created_at",
        cursor: Optional[str] = None,
        type: Optional[str] = "all",
    ) -> PaginatorResponse[IssuesType]:
        filters = issue_filters(filters, "POST")

        # Filter issues based on the type
        if type == "backlog":
            filters["state__group__in"] = ["backlog"]
        elif type == "active":
            filters["state__group__in"] = ["unstarted", "started"]

        cycles_issues = await sync_to_async(list)(
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project,
                issue_cycle__cycle_id=cycle,
            )
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .order_by(orderBy, "-created_at")
            .filter(**filters)
        )
        return paginate(results_object=cycles_issues, cursor=cursor)
