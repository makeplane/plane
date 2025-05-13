# Python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import DeployBoard, Intake, APIToken, IntakeIssue, Issue
from plane.db.models.asset import FileAsset
from plane.ee.models import IntakeSetting
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.utils.exception_logger import log_exception
from plane.ee.utils.intake_email_anchor import get_anchors


def create_intake_issue(deploy_board, message, intake):
    # Api token
    api_token = APIToken.objects.filter(
        workspace_id=deploy_board.workspace_id,
        user__is_bot=True,
        user__bot_type="INTAKE_BOT",
    ).first()

    if not api_token:
        return

    # issue data
    issue_data = {
        "name": message.get("subject"),
        "description_html": "<p>" + message.get("body", "") + "</p>"
        if message.get("body")
        else "<p></p>",
    }

    issue = Issue.objects.create(
        project_id=deploy_board.project_id,
        name=issue_data["name"],
        description_html=issue_data["description_html"],
        created_by_id=api_token.user.id,
    )

    # create an Intake issue
    intake_issue = IntakeIssue.objects.create(
        intake_id=intake.id,
        project_id=deploy_board.project_id,
        issue_id=issue.id,
        source="EMAIL",
        source_email=message.get("from"),
        extra={"username": message.get("from")},
        created_by_id=api_token.user.id,
    )
    # Create an Issue Activity
    issue_activity.delay(
        type="issue.activity.created",
        requested_data=json.dumps(issue_data, cls=DjangoJSONEncoder),
        actor_id=str(api_token.user_id),
        issue_id=str(issue.id),
        project_id=str(deploy_board.project_id),
        current_instance=None,
        epoch=int(timezone.now().timestamp()),
        notification=True,
        origin=None,
        intake=str(intake_issue.id),
    )
    return issue.id


def update_assets(issue_id, attachment_ids):
    # Update the issue_id and is_uploaded status for the file assets
    FileAsset.objects.filter(pk__in=attachment_ids).update(
        issue_id=issue_id, is_uploaded=True
    )

    # Spawn meta bgtask
    [
        get_asset_object_metadata.delay(asset_id=str(asset_id))
        for asset_id in attachment_ids
    ]
    return


@shared_task
def intake_email(message):
    try:
        if message.get("subject") is None:
            return
        # Get the publish anchor and workspace slug
        publish_anchor, workspace_slug = get_anchors(message.get("to", ""))

        # Check if publish anchor or workspace slug is empty
        if not publish_anchor or not workspace_slug:
            return

        # Check if workspace has feature flag enabled
        if not check_workspace_feature_flag(
            feature_key=FeatureFlag.INTAKE_EMAIL, slug=workspace_slug
        ):
            return

        # Get the deploy boards
        deploy_board = DeployBoard.objects.get(
            workspace__slug=workspace_slug,
            anchor=publish_anchor,
            entity_name=DeployBoard.DeployBoardType.INTAKE_EMAIL,
        )

        intake = Intake.objects.filter(
            workspace_id=deploy_board.workspace_id, project_id=deploy_board.project_id
        ).first()

        if not intake:
            return

        # get the intake settings
        intake_setting = IntakeSetting.objects.get(
            project_id=deploy_board.project_id,
            workspace_id=deploy_board.workspace_id,
            intake_id=deploy_board.entity_identifier,
        )

        if not intake_setting.is_email_enabled:
            return

        # Create intake issue
        issue_id = create_intake_issue(deploy_board, message, intake)

        # update the assets
        update_assets(issue_id, message.get("attachments"))

        return
    except (DeployBoard.DoesNotExist, IntakeSetting.DoesNotExist):
        return
    except Exception as e:
        log_exception(e)
        return
