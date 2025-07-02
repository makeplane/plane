# Python imports
import json
from typing import List

# Third Party imports
from celery import shared_task

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

from plane.app.serializers import IssueActivitySerializer
from plane.bgtasks.notification_task import notifications

# Module imports
from plane.db.models import (
    Issue,
    IssueActivity,
    IssueSubscriber,
    Label,
    Project,
    User,
    Cycle,
)
from plane.settings.redis import redis_instance
from plane.utils.exception_logger import log_exception
from plane.bgtasks.webhook_task import webhook_activity


# Track changes in issue labels
def track_labels(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_labels = set([str(lab) for lab in requested_data.get("label_ids", [])])
    current_labels = set([str(lab) for lab in current_instance.get("label_ids", [])])

    added_labels = requested_labels - current_labels

    # Set of newly added labels
    for added_label in added_labels:
        label = Label.objects.get(pk=added_label)
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                project_id=project_id,
                workspace_id=workspace_id,
                verb="updated",
                field="labels",
                comment="added label ",
                old_value="",
                new_value=label.name,
                new_identifier=label.id,
                old_identifier=None,
                epoch=epoch,
            )
        )


# Track changes in issue assignees
def track_assignees(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_assignees = (
        set([str(asg) for asg in requested_data.get("assignee_ids", [])])
        if requested_data is not None
        else set()
    )
    current_assignees = (
        set([str(asg) for asg in current_instance.get("assignee_ids", [])])
        if current_instance is not None
        else set()
    )

    added_assignees = requested_assignees - current_assignees

    bulk_subscribers = []
    for added_assignee in added_assignees:
        assignee = User.objects.get(pk=added_assignee)
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value="",
                new_value=assignee.display_name,
                field="assignees",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="added assignee ",
                new_identifier=assignee.id,
                epoch=epoch,
            )
        )
        bulk_subscribers.append(
            IssueSubscriber(
                subscriber_id=assignee.id,
                issue_id=issue_id,
                workspace_id=workspace_id,
                project_id=project_id,
                created_by_id=assignee.id,
                updated_by_id=assignee.id,
            )
        )

    # Create assignees subscribers to the issue and ignore if already
    IssueSubscriber.objects.bulk_create(
        bulk_subscribers, batch_size=10, ignore_conflicts=True
    )


def create_cycle_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if requested_data.get("cycle_id") and current_instance.get("cycle_id"):
        new_cycle = Cycle.objects.filter(pk=requested_data.get("cycle_id")).first()
        old_cycle = Cycle.objects.filter(pk=current_instance.get("cycle_id")).first()

        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=old_cycle.name if old_cycle else None,
                new_value=new_cycle.name if new_cycle else None,
                field="cycles",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"updated cycle from {old_cycle.name if old_cycle else 'None'} to {new_cycle.name if new_cycle else 'None'}",
                old_identifier=old_cycle.id if old_cycle else None,
                new_identifier=new_cycle.id if new_cycle else None,
                epoch=epoch,
            )
        )
        return

    if requested_data.get("cycle_id"):
        cycle = Cycle.objects.filter(pk=requested_data.get("cycle_id")).first()
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="created",
                old_value="",
                new_value=cycle.name,
                field="cycles",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"added cycle {cycle.name}",
                new_identifier=cycle.id,
                epoch=epoch,
            )
        )


def delete_cycle_issue_activity(
    issue_id: str,
    project_id: str,
    workspace_id: str,
    actor_id: str,
    issue_activities: list[IssueActivity],
    epoch: float,
    requested_data: None | dict = None,
    current_instance: None | dict = None,
) -> List[IssueActivity]:
    """Create a cycle activity when a cycle is removed from an issue"""
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    # If the issue has a cycle, create a cycle activity
    if current_instance.get("cycle_id"):
        old_cycle = Cycle.objects.filter(pk=current_instance.get("cycle_id")).first()
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="deleted",
                old_value=old_cycle.name if old_cycle else None,
                new_value="",
                field="cycles",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"removed cycle {old_cycle.name if old_cycle else 'None'}",
                old_identifier=old_cycle.id if old_cycle else None,
                new_identifier=None,
                epoch=epoch,
            )
        )
    return


def update_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    ISSUE_ACTIVITY_MAPPER = {"label_ids": track_labels, "assignee_ids": track_assignees}

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    for key in requested_data:
        func = ISSUE_ACTIVITY_MAPPER.get(key)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                issue_activities=issue_activities,
                epoch=epoch,
            )


# Receive message from room group
@shared_task
def bulk_issue_activity(
    type,
    requested_data,
    current_instance,
    issue_id,
    actor_id,
    project_id,
    epoch,
    subscriber=True,
    notification=False,
    origin=None,
    inbox=None,
):
    try:
        issue_activities = []

        project = Project.objects.get(pk=project_id)
        workspace_id = project.workspace_id

        if issue_id is not None:
            if origin:
                ri = redis_instance()
                # set the request origin in redis
                ri.set(str(issue_id), origin, ex=600)
            issue = Issue.objects.filter(pk=issue_id).first()
            if issue:
                try:
                    issue.updated_at = timezone.now()
                    issue.save(update_fields=["updated_at"])
                except Exception:
                    pass

        ACTIVITY_MAPPER = {
            "issue.activity.updated": update_issue_activity,
            "cycle.activity.created": create_cycle_issue_activity,
            "cycle.activity.deleted": delete_cycle_issue_activity,
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                issue_activities=issue_activities,
                epoch=epoch,
            )

        # Save all the values to database
        issue_activities_created = IssueActivity.objects.bulk_create(issue_activities)
        # Post the updates to segway for integrations and webhooks
        if len(issue_activities_created):
            for activity in issue_activities_created:
                webhook_activity.delay(
                    event=(
                        "issue_comment"
                        if activity.field == "comment"
                        else "inbox_issue"
                        if inbox
                        else "issue"
                    ),
                    event_id=(
                        activity.issue_comment_id
                        if activity.field == "comment"
                        else inbox
                        if inbox
                        else activity.issue_id
                    ),
                    verb=activity.verb,
                    field=(
                        "description" if activity.field == "comment" else activity.field
                    ),
                    old_value=(
                        activity.old_value if activity.old_value != "" else None
                    ),
                    new_value=(
                        activity.new_value if activity.new_value != "" else None
                    ),
                    actor_id=activity.actor_id,
                    current_site=origin,
                    slug=activity.workspace.slug,
                    old_identifier=activity.old_identifier,
                    new_identifier=activity.new_identifier,
                )

        if notification:
            notifications.delay(
                type=type,
                issue_id=issue_id,
                actor_id=actor_id,
                project_id=project_id,
                subscriber=subscriber,
                issue_activities_created=json.dumps(
                    IssueActivitySerializer(issue_activities_created, many=True).data,
                    cls=DjangoJSONEncoder,
                ),
                requested_data=requested_data,
                current_instance=current_instance,
            )

        return
    except Exception as e:
        log_exception(e)
        return
