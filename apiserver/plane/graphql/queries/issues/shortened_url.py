# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.graphql.utils.roles import Roles
from plane.graphql.types.issue import IssueShortenedMetaInfo
from plane.db.models import Project, ProjectMember, Issue
from plane.graphql.permissions.workspace import WorkspacePermission


@sync_to_async
def project_member_exists(workspace_slug, project_identifier, user):
    try:
        project_member = ProjectMember.objects.filter(
            member=user,
            workspace__slug=workspace_slug,
            project__identifier=project_identifier,
            is_active=True,
            role__in=[Roles.ADMIN.value, Roles.MEMBER.value, Roles.GUEST.value],
        )

        if project_member.exists():
            return True

        return False
    except ProjectMember.DoesNotExist:
        return False


@sync_to_async
def get_project_id(workspace_slug, project_identifier):
    try:
        project = Project.objects.only("id").get(
            workspace__slug=workspace_slug,
            identifier=project_identifier,
            archived_at__isnull=True,
        )
        return project.id
    except Project.DoesNotExist:
        message = "Project not found."
        error_extensions = {"code": "PROJECT_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_issue_id(workspace_slug, project_id, issue_sequence):
    try:
        issue = Issue.issue_objects.only("id").get(
            workspace__slug=workspace_slug,
            project_id=project_id,
            sequence_id=issue_sequence,
        )
        return issue.id
    except Issue.DoesNotExist:
        message = "Issue not found."
        error_extensions = {"code": "ISSUE_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


# issues query
@strawberry.type
class IssueShortenedMetaInfoQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def issue_shortened_meta_info(
        self, info: Info, slug: str, work_item_identifier: str
    ) -> IssueShortenedMetaInfo:
        workspace_slug = slug
        project_identifier = None
        issue_sequence = None

        if work_item_identifier:
            work_item_identifier = work_item_identifier.split("-")
            if len(work_item_identifier) == 2:
                project_identifier = work_item_identifier[0]
                issue_sequence = work_item_identifier[1]

        if not workspace_slug or not project_identifier or not issue_sequence:
            message = "Issue not found."
            error_extensions = {"code": "ISSUE_NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        is_project_member = await project_member_exists(
            workspace_slug, project_identifier, info.context.user
        )
        if not is_project_member:
            message = "User does not have permission to access this project."
            error_extensions = {"code": "UNAUTHORIZED", "statusCode": 403}
            raise GraphQLError(message, extensions=error_extensions)

        project_id = await get_project_id(workspace_slug, project_identifier)

        issue_id = await get_issue_id(workspace_slug, project_id, issue_sequence)

        return IssueShortenedMetaInfo(project=str(project_id), work_item=str(issue_id))
