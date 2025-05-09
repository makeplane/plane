# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Prefetch

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import CommentReaction, IssueComment
from plane.graphql.helpers import is_epic_feature_flagged, is_project_epics_enabled
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.epics.comment import EpicCommentActivityType


@strawberry.type
class EpicCommentQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic_comments(
        self, info: Info, slug: str, project: str, epic: str
    ) -> list[EpicCommentActivityType]:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        epic_comments = await sync_to_async(list)(
            IssueComment.objects.filter(workspace__slug=slug)
            .filter(project__id=project)
            .filter(issue_id=epic)
            .filter(deleted_at__isnull=True)
            .filter(
                project__project_projectmember__member=user_id,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("created_at")
            .select_related("actor", "issue", "project", "workspace")
            .prefetch_related(
                Prefetch(
                    "comment_reactions",
                    queryset=CommentReaction.objects.select_related("actor"),
                )
            )
        )

        return epic_comments
