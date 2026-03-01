# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Intake, APIToken, IntakeIssue, Issue, State, IssueAssignee
from plane.db.models.asset import FileAsset
from plane.ee.models import IntakeSetting, IntakeResponsibility, IntakeEmail
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.utils.exception_logger import log_exception
from plane.ee.utils.intake_email_anchor import get_anchors


def create_intake_issue(intake_email_obj, message, intake):
    # Api token
    api_token = APIToken.objects.filter(
        workspace_id=intake_email_obj.workspace_id,
        user__is_bot=True,
        user__bot_type="INTAKE_BOT",
    ).first()

    if not api_token:
        return

    # issue data
    issue_data = {
        "name": message.get("subject"),
        "description_html": "<p>" + message.get("body", "") + "</p>" if message.get("body") else "<p></p>",
    }

    triage_state = State.triage_objects.filter(
        project_id=intake_email_obj.project_id, workspace_id=intake_email_obj.workspace_id
    ).first()
    if not triage_state:
        triage_state = State.create_triage_state(
            workspace_id=intake_email_obj.workspace_id, project_id=intake_email_obj.project_id
        )

    issue = Issue.objects.create(
        project_id=intake_email_obj.project_id,
        name=issue_data["name"],
        description_html=issue_data["description_html"],
        created_by_id=api_token.user.id,
        state_id=triage_state.id,
    )

    # Check if the intake responsibility feature flag is enabled
    if check_workspace_feature_flag(
        feature_key=FeatureFlag.INTAKE_RESPONSIBILITY,
        slug=intake_email_obj.workspace.slug,
    ):
        # Get the intake responsibilities
        intake_responsibilities = IntakeResponsibility.objects.filter(intake=intake).values_list("user_id", flat=True)
        # Add the intake responsible as issue assignees
        IssueAssignee.objects.bulk_create(
            [
                IssueAssignee(
                    issue=issue,
                    assignee_id=user_id,
                    project_id=intake_email_obj.project_id,
                    workspace_id=intake_email_obj.workspace_id,
                    created_by_id=api_token.user.id,
                    updated_by_id=api_token.user.id,
                )
                for user_id in intake_responsibilities
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

    # create an Intake issue
    intake_issue = IntakeIssue.objects.create(
        intake_id=intake.id,
        project_id=intake_email_obj.project_id,
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
        project_id=str(intake_email_obj.project_id),
        current_instance=None,
        epoch=int(timezone.now().timestamp()),
        notification=True,
        origin=None,
        intake=str(intake_issue.id),
    )
    return issue.id


def update_assets(issue_id, attachment_ids):
    if not attachment_ids:
        return
    # Update the issue_id and is_uploaded status for the file assets
    FileAsset.objects.filter(pk__in=attachment_ids).update(issue_id=issue_id, is_uploaded=True)

    # Spawn meta background task
    [get_asset_object_metadata.delay(asset_id=str(asset_id)) for asset_id in attachment_ids]
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
        if not check_workspace_feature_flag(feature_key=FeatureFlag.INTAKE_EMAIL, slug=workspace_slug):
            return

        # Get the IntakeEmail record
        intake_email_obj = IntakeEmail.objects.get(
            workspace__slug=workspace_slug,
            anchor=publish_anchor,
        )

        intake = Intake.objects.filter(
            workspace_id=intake_email_obj.workspace_id, project_id=intake_email_obj.project_id
        ).first()

        if not intake:
            return

        # get the intake settings
        intake_setting = IntakeSetting.objects.get(
            project_id=intake_email_obj.project_id,
            workspace_id=intake_email_obj.workspace_id,
            intake_id=intake_email_obj.intake_id,
        )

        if not intake_setting.is_email_enabled:
            return

        # Create intake issue
        issue_id = create_intake_issue(intake_email_obj, message, intake)

        # update the assets
        update_assets(issue_id, message.get("attachments"))

        return
    except (IntakeEmail.DoesNotExist, IntakeSetting.DoesNotExist):
        return
    except Exception as e:
        log_exception(e)
        return
