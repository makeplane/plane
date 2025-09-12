# Python imports
import json

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.db.models import Issue, State, IntakeIssue
from plane.graphql.helpers import (
    get_intake_work_item_async,
    get_project,
    get_workspace,
    is_project_intakes_enabled_async,
)
from plane.graphql.permissions.project import ProjectPermission, Roles
from plane.graphql.types.intake.base import (
    IntakeWorkItemStatusType,
    IntakeWorkItemStatusInputType,
    IntakeWorkItemType,
)


@sync_to_async
def handle_intake_status_activity(
    info: Info,
    project_id: str,
    intake_work_item: IntakeIssue,
    intake_work_item_status_input: IntakeWorkItemStatusInputType,
):
    user = info.context.user
    user_id = str(user.id)

    # create a activity for status change
    issue_activity.delay(
        type="intake.activity.created",
        requested_data=json.dumps({"status": intake_work_item_status_input.status}),
        actor_id=user_id,
        issue_id=intake_work_item.issue_id,
        project_id=project_id,
        current_instance=json.dumps({"status": intake_work_item.status}),
        epoch=int(timezone.now().timestamp()),
        origin=info.context.request.META.get("HTTP_ORIGIN"),
        intake=intake_work_item.id,
        notification=False,
    )


@sync_to_async
def handle_intake_work_item_status_pending(intake_work_item: IntakeIssue):
    intake_work_item.status = IntakeWorkItemStatusType.PENDING.value
    intake_work_item.snoozed_till = None
    intake_work_item.duplicate_to = None
    intake_work_item.save()

    return intake_work_item


@sync_to_async
def handle_intake_work_item_status_snooze(
    intake_work_item: IntakeIssue,
    intake_work_item_status_input: IntakeWorkItemStatusInputType,
):
    if intake_work_item_status_input.snoozed_till is None:
        message = "Snoozed till is required"
        error_extensions = {
            "code": "SNOOZED_TILL_REQUIRED",
            "statusCode": 400,
        }
        raise GraphQLError(message, extensions=error_extensions)

    intake_work_item.status = IntakeWorkItemStatusType.SNOOZED.value
    intake_work_item.snoozed_till = intake_work_item_status_input.snoozed_till
    intake_work_item.duplicate_to = None
    intake_work_item.save()

    return intake_work_item


@sync_to_async
def handle_intake_work_item_status_accept(
    workspace_slug: str, project_id: str, intake_work_item: IntakeIssue
):
    intake_work_item.status = IntakeWorkItemStatusType.ACCEPTED.value
    intake_work_item.snoozed_till = None
    intake_work_item.duplicate_to = None
    intake_work_item.save()

    work_item_id = intake_work_item.issue_id
    work_item = Issue.objects.get(
        workspace__slug=workspace_slug,
        project_id=project_id,
        id=work_item_id,
    )

    if work_item.state.is_triage:
        state = State.objects.filter(
            workspace__slug=workspace_slug, project_id=project_id, default=True
        ).first()

        if state is not None:
            work_item.state = state
            work_item.save()

    return intake_work_item


@sync_to_async
def handle_intake_work_item_status_decline(
    workspace_slug: str, project_id: str, intake_work_item: IntakeIssue
):
    intake_work_item.status = IntakeWorkItemStatusType.REJECTED.value
    intake_work_item.snoozed_till = None
    intake_work_item.duplicate_to = None
    intake_work_item.save()

    work_item_id = intake_work_item.issue_id
    work_item = Issue.objects.get(
        workspace__slug=workspace_slug,
        project_id=project_id,
        id=work_item_id,
    )
    state = State.objects.filter(
        workspace__slug=workspace_slug,
        project_id=project_id,
        group="cancelled",
    ).first()

    if state is not None and work_item is not None:
        work_item.state = state
        work_item.save()

    return intake_work_item


@sync_to_async
def handle_intake_work_item_status_duplicate(
    workspace_slug: str,
    project_id: str,
    intake_work_item: IntakeWorkItemType,
    intake_work_item_status_input: IntakeWorkItemStatusInputType,
):
    try:
        if intake_work_item_status_input.duplicate_to is None:
            message = "Duplicate to is required"
            error_extensions = {
                "code": "DUPLICATE_TO_REQUIRED",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        intake_work_item.status = IntakeWorkItemStatusType.DUPLICATE.value
        intake_work_item.duplicate_to_id = intake_work_item_status_input.duplicate_to
        intake_work_item.snoozed_till = None
        intake_work_item.save()

        work_item_id = intake_work_item.issue_id
        work_item = Issue.objects.get(
            workspace__slug=workspace_slug,
            project_id=project_id,
            id=work_item_id,
        )
        state = State.objects.filter(
            workspace__slug=workspace_slug,
            project_id=project_id,
            group="cancelled",
        ).first()

        if state is not None and work_item is not None:
            work_item.state = state
            work_item.save()

        return intake_work_item
    except Exception as e:
        raise e


@strawberry.type
class IntakeWorkItemStatusMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectPermission([Roles.ADMIN])])]
    )
    async def update_intake_work_item_status(
        self,
        info: Info,
        slug: str,
        project: str,
        intake_work_item: str,
        intake_work_item_status_input: IntakeWorkItemStatusInputType,
    ) -> bool:
        try:
            # get the workspace
            workspace = await get_workspace(workspace_slug=slug)
            workspace_slug = workspace.slug

            # get the project
            project_details = await get_project(
                workspace_slug=workspace_slug, project_id=project
            )
            project_id = str(project_details.id)

            # check if the intake is enabled for the project
            await is_project_intakes_enabled_async(
                workspace_slug=workspace_slug, project_id=project_id
            )

            intake_work_item_input_status = intake_work_item_status_input.status

            # check if the status is provided
            if intake_work_item_input_status is None:
                message = "Status is required"
                error_extensions = {
                    "code": "STATUS_REQUIRED",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)

            # check if the status is valid
            if intake_work_item_input_status not in [
                IntakeWorkItemStatusType.ACCEPTED.value,
                IntakeWorkItemStatusType.PENDING.value,
                IntakeWorkItemStatusType.REJECTED.value,
                IntakeWorkItemStatusType.DUPLICATE.value,
                IntakeWorkItemStatusType.SNOOZED.value,
            ]:
                message = "Invalid status"
                error_extensions = {
                    "code": "INVALID_STATUS",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)

            # get the intake work item
            intake_work_item_details = await get_intake_work_item_async(
                workspace_slug=workspace_slug,
                project_id=project_id,
                intake_work_item_id=intake_work_item,
            )
            activity_intake_work_item_details = intake_work_item_details

            # pending the intake work item
            if intake_work_item_input_status == IntakeWorkItemStatusType.PENDING.value:
                intake_work_item_details = await handle_intake_work_item_status_pending(
                    intake_work_item=intake_work_item_details
                )

            # snooze the intake work item
            if intake_work_item_input_status == IntakeWorkItemStatusType.SNOOZED.value:
                intake_work_item_details = await handle_intake_work_item_status_snooze(
                    intake_work_item=intake_work_item_details,
                    intake_work_item_status_input=intake_work_item_status_input,
                )

            # accept the intake work item
            if intake_work_item_input_status == IntakeWorkItemStatusType.ACCEPTED.value:
                intake_work_item_details = await handle_intake_work_item_status_accept(
                    workspace_slug=workspace_slug,
                    project_id=project_id,
                    intake_work_item=intake_work_item_details,
                )

            # decline the intake work item
            if intake_work_item_input_status == IntakeWorkItemStatusType.REJECTED.value:
                intake_work_item_details = await handle_intake_work_item_status_decline(
                    workspace_slug=workspace_slug,
                    project_id=project_id,
                    intake_work_item=intake_work_item_details,
                )

            # duplicate the intake work item
            if (
                intake_work_item_input_status
                == IntakeWorkItemStatusType.DUPLICATE.value
            ):
                intake_work_item_details = (
                    await handle_intake_work_item_status_duplicate(
                        workspace_slug=workspace_slug,
                        project_id=project_id,
                        intake_work_item=intake_work_item_details,
                        intake_work_item_status_input=intake_work_item_status_input,
                    )
                )

            # create a activity for status change
            await handle_intake_status_activity(
                info=info,
                project_id=project_id,
                intake_work_item=activity_intake_work_item_details,
                intake_work_item_status_input=intake_work_item_status_input,
            )

            return True
        except GraphQLError as e:
            raise e
        except Exception:
            message = "Something went wrong"
            error_extensions = {
                "code": "SOMETHING_WENT_WRONG",
                "statusCode": 400,
            }

            raise GraphQLError(message, extensions=error_extensions)
