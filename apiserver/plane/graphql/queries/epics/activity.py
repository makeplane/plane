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
from plane.db.models import IssueActivity
from plane.graphql.helpers import is_epic_feature_flagged, is_project_epics_enabled
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.epics.activity import EpicPropertyActivityType


@strawberry.type
class EpicActivityQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic_activities(
        self, info: Info, slug: str, project: str, epic: str
    ) -> list[EpicPropertyActivityType]:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        epic_activities = await sync_to_async(list)(
            IssueActivity.objects.filter(workspace__slug=slug)
            .filter(project__id=project)
            .filter(issue_id=epic)
            .filter(deleted_at__isnull=True)
            .filter(
                ~Q(field__in=["comment", "vote", "reaction", "draft"]),
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("actor", "workspace", "issue", "project")
            .order_by("created_at")
        )

        return epic_activities
