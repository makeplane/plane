# Python Standard Library Imports
from typing import Optional

# Third-Party Imports
import pytz
import strawberry

# Django Imports
from asgiref.sync import sync_to_async
from django.db.models import Case, CharField, Exists, OuterRef, Q, Subquery, Value, When
from django.utils import timezone

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import Cycle, CycleUserProperties, Issue, Project, UserFavorite
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.cycle import CycleType, CycleUserPropertyType
from plane.graphql.types.issues.base import (
    IssuesInformationObjectType,
    IssuesInformationType,
    IssuesType,
)
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.issue import issue_information_query_execute
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.work_item_filters import work_item_filters


@sync_to_async
def get_project(project_id):
    return Project.objects.get(id=project_id)


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
        ids: Optional[list[strawberry.ID]] = None,
    ) -> list[CycleType]:
        user = info.context.user
        user_id = str(user.id)

        project_details = await get_project(project)

        # Fetch project for the specific record or pass project_id dynamically
        project_timezone = project_details.timezone

        # Convert the current time (timezone.now()) to the project's timezone
        local_tz = pytz.timezone(project_timezone)
        current_time_in_project_tz = timezone.now().astimezone(local_tz)

        current_time_in_utc = current_time_in_project_tz.astimezone(pytz.utc)

        fav_subquery = UserFavorite.objects.filter(
            workspace__slug=slug,
            project_id=project,
            user=info.context.user,
            entity_type="cycle",
            entity_identifier=OuterRef("pk"),
        ).values("id")

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        cycle_query = (
            Cycle.objects.filter(workspace__slug=slug, project_id=project)
            .filter(project_teamspace_filter.query)
            .distinct()
        )

        if ids:
            cycle_query = cycle_query.filter(id__in=ids)
        else:
            cycle_query = cycle_query.filter(
                Q(start_date__isnull=True, end_date__isnull=True)
                | Q(
                    start_date__lte=current_time_in_utc,
                    end_date__gte=current_time_in_utc,
                )
                | (Q(start_date__isnull=False) & Q(start_date__gte=current_time_in_utc))
            )

        # get cycles those are current and upcoming cycles based on the start_date and
        # end_date
        cycles = await sync_to_async(list)(
            cycle_query.order_by("start_date")
            .annotate(is_favorite=Exists(fav_subquery))
            .annotate(favorite_id=Subquery(fav_subquery[:1]))
            .annotate(
                status=Case(
                    When(
                        Q(start_date__lte=current_time_in_utc)
                        & Q(end_date__gte=current_time_in_utc),
                        then=Value("CURRENT"),
                    ),
                    When(start_date__gt=current_time_in_utc, then=Value("UPCOMING")),
                    When(end_date__lt=current_time_in_utc, then=Value("COMPLETED")),
                    When(
                        Q(start_date__isnull=True) & Q(end_date__isnull=True),
                        then=Value("DRAFT"),
                    ),
                    default=Value("DRAFT"),
                    output_field=CharField(),
                )
            )
        )

        return cycles

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycle(
        self, info: Info, slug: str, project: strawberry.ID, cycle: strawberry.ID
    ) -> CycleType:
        user = info.context.user
        user_id = str(user.id)

        project_details = await get_project(project)

        # Fetch project for the specific record or pass project_id dynamically
        project_timezone = project_details.timezone

        # Convert the current time (timezone.now()) to the project's timezone
        local_tz = pytz.timezone(project_timezone)
        current_time_in_project_tz = timezone.now().astimezone(local_tz)

        current_time_in_utc = current_time_in_project_tz.astimezone(pytz.utc)

        fav_subquery = UserFavorite.objects.filter(
            workspace__slug=slug,
            project_id=project,
            user=info.context.user,
            entity_type="cycle",
            entity_identifier=OuterRef("pk"),
        ).values("id")

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        cycle_query = (
            Cycle.objects.filter(
                workspace__slug=slug,
                project_id=project,
                id=cycle,
            )
            .filter(project_teamspace_filter.query)
            .distinct()
            .annotate(is_favorite=Exists(fav_subquery))
            .annotate(favorite_id=Subquery(fav_subquery[:1]))
            .annotate(
                status=Case(
                    When(
                        Q(start_date__lte=current_time_in_utc)
                        & Q(end_date__gte=current_time_in_utc),
                        then=Value("CURRENT"),
                    ),
                    When(start_date__gt=current_time_in_utc, then=Value("UPCOMING")),
                    When(end_date__lt=current_time_in_utc, then=Value("COMPLETED")),
                    When(
                        Q(start_date__isnull=True) & Q(end_date__isnull=True),
                        then=Value("DRAFT"),
                    ),
                    default=Value("DRAFT"),
                    output_field=CharField(),
                )
            )
        )

        cycle_details = await sync_to_async(cycle_query.first)()

        # Background task to update recent visited project
        user_id = info.context.user.id
        recent_visited_task.delay(
            slug=slug,
            project_id=project,
            user_id=user_id,
            entity_name="cycle",
            entity_identifier=cycle,
        )

        return cycle_details


# cycle issue user properties
@strawberry.type
class CycleIssueUserPropertyQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def cycleIssueUserProperties(
        self, info: Info, slug: str, project: strawberry.ID, cycle: strawberry.ID
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
        filters = work_item_filters(filters)

        # all issues tab information
        (all_issue_count, all_issue_group_info) = await issue_information_query_execute(
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
                totalIssues=active_issue_count, groupInfo=active_issue_group_info
            ),
            backlog=IssuesInformationObjectType(
                totalIssues=backlog_issue_count, groupInfo=backlog_issue_group_info
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
        user = info.context.user
        user_id = str(user.id)

        filters = work_item_filters(filters)

        # Filter issues based on the type
        if type == "backlog":
            filters["state__group__in"] = ["backlog"]
        elif type == "active":
            filters["state__group__in"] = ["unstarted", "started"]

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        cycles_issues = await sync_to_async(list)(
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project,
                issue_cycle__cycle_id=cycle,
                issue_cycle__deleted_at__isnull=True,
            )
            .filter(project_teamspace_filter.query)
            .distinct()
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .order_by(orderBy, "-created_at")
            .filter(**filters)
        )
        return paginate(results_object=cycles_issues, cursor=cursor)
