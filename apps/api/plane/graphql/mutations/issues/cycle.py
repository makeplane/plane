# Python imports
import json
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.core import serializers
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import CycleIssue, Workspace
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.permissions.project import ProjectMemberPermission


def raise_error_exception(
    message: str, error_extensions: dict, e: Optional[Exception] = None
):
    message = e.message if hasattr(e, "message") else message
    error_extensions = (
        e.error_extensions if hasattr(e, "error_extensions") else error_extensions
    )
    raise GraphQLError(message, extensions=error_extensions)


# TODO: remove this function and use the one in the helpers
# getting the workspace
def get_workspace(workspace_slug: str) -> Workspace:
    try:
        return Workspace.objects.get(slug=workspace_slug)
    except Workspace.DoesNotExist:
        message = "Workspace not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise_error_exception(message, error_extensions)
    except Exception as e:
        message = "Error getting workspace"
        error_extensions = {
            "code": "SOMETHING_WENT_WRONG",
            "statusCode": 400,
        }
        raise_error_exception(message, error_extensions, e)


# creating the cycle issue activity
def create_cycle_issue_activity(
    type: str,
    actor_id: str,
    project_id: str,
    issue_id: str,
    origin: Optional[str] = None,
    requested_data: Optional[JSON] = None,
    current_instance: Optional[JSON] = None,
) -> None:
    try:
        # get epoch
        epoch = int(timezone.now().timestamp())

        # create cycle issue activity
        issue_activity.delay(
            type=type,
            actor_id=actor_id,
            project_id=project_id,
            issue_id=issue_id,
            origin=origin,
            requested_data=requested_data,
            current_instance=current_instance,
            epoch=epoch,
            notification=True,
        )
    except Exception as e:
        message = "Error creating cycle issue activity"
        error_extensions = {
            "code": "SOMETHING_WENT_WRONG",
            "statusCode": 400,
        }
        raise_error_exception(message, error_extensions, e)


# getting the cycle issues
def get_cycle_issues(
    workspace_slug: str, project_id: str, issue_id: str, cycle_id: Optional[str] = None
) -> list[CycleIssue]:
    try:
        base_query = CycleIssue.objects.filter(
            workspace__slug=workspace_slug,
            project_id=project_id,
            issue_id=issue_id,
        )

        if cycle_id:
            base_query = base_query.filter(cycle_id=cycle_id)

        cycle_issues = base_query.all()

        return list(cycle_issues)
    except Exception as e:
        message = "Error getting cycle issues"
        error_extensions = {
            "code": "SOMETHING_WENT_WRONG",
            "statusCode": 400,
        }
        raise_error_exception(message, error_extensions, e)


# getting the cycle issues asynchronously
@sync_to_async
def get_cycle_issues_async(
    workspace_slug: str,
    project_id: str,
    issue_id: str,
    cycle_id: Optional[str] = None,
) -> list[CycleIssue]:
    return get_cycle_issues(
        workspace_slug=workspace_slug,
        project_id=project_id,
        issue_id=issue_id,
        cycle_id=cycle_id,
    )


# creating the cycle issue
@sync_to_async
def create_cycle_issue(
    user_id: str,
    workspace_slug: str,
    project_id: str,
    issue_id: str,
    new_cycle_id: str,
    origin: str,
) -> bool:
    try:
        # get workspace
        workspace = get_workspace(workspace_slug)

        # create cycle issue
        cycle_issue = CycleIssue.objects.create(
            workspace=workspace,
            project_id=project_id,
            issue_id=issue_id,
            cycle_id=new_cycle_id,
            created_by_id=user_id,
            updated_by_id=user_id,
        )

        # workitem activity
        created_cycle_issue_activity = serializers.serialize("json", [cycle_issue])
        create_cycle_issue_activity(
            type="cycle.activity.created",
            actor_id=user_id,
            project_id=project_id,
            issue_id=issue_id,
            origin=origin,
            requested_data=None,
            current_instance=json.dumps(
                {
                    "created_cycle_issues": created_cycle_issue_activity,
                    "updated_cycle_issues": [],
                }
            ),
        )

        return True
    except Exception as e:
        message = "Error creating cycle issue"
        error_extensions = {
            "code": "SOMETHING_WENT_WRONG",
            "statusCode": 400,
        }
        raise_error_exception(message, error_extensions, e)


# updating the cycle issue
@sync_to_async
def update_cycle_issue(
    user_id: str,
    workspace_slug: str,
    project_id: str,
    issue_id: str,
    old_cycle_id: str,
    new_cycle_id: str,
    origin: str,
) -> bool:
    try:
        # get the current cycle issue
        current_cycle_issues = get_cycle_issues(
            workspace_slug=workspace_slug,
            project_id=project_id,
            issue_id=issue_id,
            cycle_id=old_cycle_id,
        )

        current_cycle_issue = (
            current_cycle_issues[0]
            if current_cycle_issues and len(current_cycle_issues) > 0
            else None
        )

        # update the cycle issue
        if current_cycle_issue:
            current_cycle_issue.cycle_id = new_cycle_id
            current_cycle_issue.updated_by_id = user_id

            current_cycle_issue.save(update_fields=["cycle_id", "updated_by_id"])

        # issue activity

        update_cycle_issue_activity = [
            {
                "old_cycle_id": str(old_cycle_id),
                "new_cycle_id": str(new_cycle_id),
                "issue_id": str(issue_id),
            }
        ]
        create_cycle_issue_activity(
            type="cycle.activity.created",
            actor_id=user_id,
            project_id=project_id,
            issue_id=issue_id,
            origin=origin,
            requested_data=None,
            current_instance=json.dumps(
                {
                    "created_cycle_issues": json.dumps([]),
                    "updated_cycle_issues": update_cycle_issue_activity,
                }
            ),
        )

        return True
    except Exception as e:
        message = "Error updating cycle issue"
        error_extensions = {
            "code": "SOMETHING_WENT_WRONG",
            "statusCode": 400,
        }
        raise_error_exception(message, error_extensions, e)


# deleting the cycle issue
@sync_to_async
def delete_cycle_issue(
    user_id: str,
    workspace_slug: str,
    project_id: str,
    issue_id: str,
    origin: str,
) -> bool:
    try:
        # get cycle issues
        cycle_issues = get_cycle_issues(
            workspace_slug=workspace_slug,
            project_id=project_id,
            issue_id=issue_id,
        )

        # delete the cycle issues
        for cycle_issue in cycle_issues:
            cycle_id = str(cycle_issue.cycle_id) if cycle_issue.cycle_id else None

            # issue activity
            create_cycle_issue_activity(
                type="cycle.activity.deleted",
                actor_id=user_id,
                project_id=project_id,
                issue_id=issue_id,
                origin=origin,
                requested_data=json.dumps({"cycle_id": cycle_id, "issues": [issue_id]}),
                current_instance=None,
            )

            # delete cycle issue
            cycle_issue.delete()

        return True
    except Exception as e:
        message = "Error deleting cycle issue"
        error_extensions = {
            "code": "SOMETHING_WENT_WRONG",
            "statusCode": 400,
        }
        raise_error_exception(message, error_extensions, e)


@strawberry.type
class IssueCycleMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def issue_cycle(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        cycle: Optional[strawberry.ID] = None,
    ) -> bool:
        try:
            user = info.context.user
            user_id = str(user.id)

            origin = info.context.request.META.get("HTTP_ORIGIN")

            project_id = str(project)

            new_cycle_id = None
            removed_cycle_id = None

            # Filter out existing issues
            cycle_issues = await get_cycle_issues_async(
                workspace_slug=slug,
                project_id=project_id,
                issue_id=issue,
            )
            existing_cycle = cycle_issues[0] if len(cycle_issues) > 0 else None
            existing_cycle_id = str(existing_cycle.cycle_id) if existing_cycle else None

            if cycle:
                if existing_cycle_id is None:
                    new_cycle_id = str(cycle)
                elif existing_cycle_id and existing_cycle_id != cycle:
                    new_cycle_id = str(cycle)
                    removed_cycle_id = existing_cycle_id
                elif existing_cycle_id and existing_cycle_id == cycle:
                    return True
            else:
                if existing_cycle_id:
                    removed_cycle_id = existing_cycle_id
                else:
                    return True

            # remove cycle issues
            if removed_cycle_id is not None and new_cycle_id is None:
                await delete_cycle_issue(
                    user_id=user_id,
                    workspace_slug=slug,
                    project_id=project_id,
                    issue_id=issue,
                    origin=origin,
                )

            # update cycle issues
            if new_cycle_id is not None and removed_cycle_id is not None:
                await update_cycle_issue(
                    user_id=user_id,
                    workspace_slug=slug,
                    project_id=project_id,
                    issue_id=issue,
                    old_cycle_id=removed_cycle_id,
                    new_cycle_id=new_cycle_id,
                    origin=origin,
                )

            # create cycle issue
            if new_cycle_id is not None and removed_cycle_id is None:
                await create_cycle_issue(
                    user_id=user_id,
                    workspace_slug=slug,
                    project_id=project_id,
                    issue_id=issue,
                    new_cycle_id=new_cycle_id,
                    origin=origin,
                )

            return True
        except Exception as e:
            message = "Error updating cycle issue"
            error_extensions = {
                "code": "SOMETHING_WENT_WRONG",
                "statusCode": 400,
            }
            raise_error_exception(message, error_extensions, e)
