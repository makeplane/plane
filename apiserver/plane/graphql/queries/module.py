# Python Standard Library Imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Exists, OuterRef, Subquery

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import Issue, Module, ModuleUserProperties, UserFavorite
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.issues.base import (
    IssuesInformationObjectType,
    IssuesInformationType,
    IssuesType,
)
from plane.graphql.types.module import ModuleType, ModuleUserPropertyType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.issue import issue_information_query_execute
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.work_item_filters import work_item_filters


@strawberry.type
class ModuleQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def modules(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cursor: Optional[str] = None,
        ids: Optional[list[strawberry.ID]] = None,
    ) -> PaginatorResponse[ModuleType]:
        subquery = UserFavorite.objects.filter(
            user=info.context.user,
            entity_type="module",
            entity_identifier=OuterRef("pk"),
            project_id=project,
        )

        module_query = Module.objects.filter(
            workspace__slug=slug,
            project_id=project,
            project__project_projectmember__member=info.context.user,
            project__project_projectmember__is_active=True,
        )

        if ids:
            module_query = module_query.filter(id__in=ids)

        modules = await sync_to_async(list)(
            module_query.annotate(is_favorite=Exists(subquery))
        )

        return paginate(results_object=modules, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def module(
        self, info: Info, slug: str, project: strawberry.ID, module: strawberry.ID
    ) -> ModuleType:
        fav_subquery = UserFavorite.objects.filter(
            workspace__slug=slug,
            project_id=project,
            user=info.context.user,
            entity_type="module",
            entity_identifier=OuterRef("pk"),
        ).values("id")

        module_query = (
            Module.objects.filter(
                workspace__slug=slug,
                project_id=project,
                id=module,
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
            .annotate(is_favorite=Exists(fav_subquery))
            .annotate(favorite_id=Subquery(fav_subquery[:1]))
        )

        module_details = await sync_to_async(module_query.first)()

        # Background task to update recent visited project
        user_id = info.context.user.id
        recent_visited_task.delay(
            slug=slug,
            project_id=project,
            user_id=user_id,
            entity_name="module",
            entity_identifier=module,
        )

        return module_details


# module issue user properties
@strawberry.type
class ModuleIssueUserPropertyQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def moduleIssueUserProperties(
        self, info: Info, slug: str, project: strawberry.ID, module: strawberry.ID
    ) -> ModuleUserPropertyType:
        def get_module_issue_user_property():
            module_properties, _ = ModuleUserProperties.objects.get_or_create(
                workspace__slug=slug,
                project_id=project,
                module_id=module,
                user=info.context.user,
            )
            return module_properties

        module_issue_property = await sync_to_async(
            lambda: get_module_issue_user_property()
        )()

        return module_issue_property


# module issues information query
@strawberry.type
class ModuleIssuesInformationQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def moduleIssuesInformation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
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
            module=module,
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
            module=module,
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
            module=module,
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


# module issues
@strawberry.type
class ModuleIssueQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def moduleIssues(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
        filters: Optional[JSON] = {},
        orderBy: Optional[str] = "-created_at",
        cursor: Optional[str] = None,
        type: Optional[str] = "all",
    ) -> PaginatorResponse[IssuesType]:
        filters = work_item_filters(filters)

        # Filter issues based on the type
        if type == "backlog":
            filters["state__group__in"] = ["backlog"]
        elif type == "active":
            filters["state__group__in"] = ["unstarted", "started"]

        module_issues = await sync_to_async(list)(
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project,
                issue_module__module_id=module,
                issue_module__deleted_at__isnull=True,
            )
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .order_by(orderBy, "-created_at")
            .filter(**filters)
            .distinct()
        )

        return paginate(results_object=module_issues, cursor=cursor)
