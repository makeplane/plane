# Python imports
import json

import requests

# Third Party imports
from celery import shared_task

# Django imports
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

from plane.app.serializers import IssueActivitySerializer
from plane.bgtasks.notification_task import notifications

# Module imports
from plane.db.models import (
    CommentReaction,
    Cycle,
    Issue,
    IssueActivity,
    IssueComment,
    IssueReaction,
    IssueSubscriber,
    Label,
    Module,
    Project,
    State,
    User,
    EstimatePoint,
)
from plane.settings.redis import redis_instance
from plane.utils.exception_logger import log_exception
from plane.bgtasks.webhook_task import webhook_activity


# Track Changes in name
def track_name(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("name") != requested_data.get("name"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("name"),
                new_value=requested_data.get("name"),
                field="name",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the name to",
                epoch=epoch,
            )
        )


# Track issue description
def track_description(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("description_html") != requested_data.get(
        "description_html"
    ):
        last_activity = (
            IssueActivity.objects.filter(issue_id=issue_id)
            .order_by("-created_at")
            .first()
        )
        if (
            last_activity is not None
            and last_activity.field == "description"
            and actor_id == str(last_activity.actor_id)
        ):
            last_activity.created_at = timezone.now()
            last_activity.save(update_fields=["created_at"])
        else:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor_id=actor_id,
                    verb="updated",
                    old_value=current_instance.get("description_html"),
                    new_value=requested_data.get("description_html"),
                    field="description",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="updated the description to",
                    epoch=epoch,
                )
            )


# Track changes in parent issue
def track_parent(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("parent_id") != requested_data.get("parent_id"):
        old_parent = (
            Issue.objects.filter(pk=current_instance.get("parent_id")).first()
            if current_instance.get("parent_id") is not None
            else None
        )
        new_parent = (
            Issue.objects.filter(pk=requested_data.get("parent_id")).first()
            if requested_data.get("parent_id") is not None
            else None
        )

        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=(
                    f"{old_parent.project.identifier}-{old_parent.sequence_id}"
                    if old_parent is not None
                    else ""
                ),
                new_value=(
                    f"{new_parent.project.identifier}-{new_parent.sequence_id}"
                    if new_parent is not None
                    else ""
                ),
                field="parent",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the parent issue to",
                old_identifier=(
                    old_parent.id if old_parent is not None else None
                ),
                new_identifier=(
                    new_parent.id if new_parent is not None else None
                ),
                epoch=epoch,
            )
        )


# Track changes in priority
def track_priority(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("priority") != requested_data.get("priority"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("priority"),
                new_value=requested_data.get("priority"),
                field="priority",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the priority to",
                epoch=epoch,
            )
        )


# Track changes in state of the issue
def track_state(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("state_id") != requested_data.get("state_id"):
        new_state = State.objects.get(pk=requested_data.get("state_id", None))
        old_state = State.objects.get(
            pk=current_instance.get("state_id", None)
        )

        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=old_state.name,
                new_value=new_state.name,
                field="state",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the state to",
                old_identifier=old_state.id,
                new_identifier=new_state.id,
                epoch=epoch,
            )
        )


# Track changes in issue target date
def track_target_date(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("target_date") != requested_data.get(
        "target_date"
    ):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=(
                    current_instance.get("target_date")
                    if current_instance.get("target_date") is not None
                    else ""
                ),
                new_value=(
                    requested_data.get("target_date")
                    if requested_data.get("target_date") is not None
                    else ""
                ),
                field="target_date",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the target date to",
                epoch=epoch,
            )
        )


# Track changes in issue start date
def track_start_date(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("start_date") != requested_data.get("start_date"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=(
                    current_instance.get("start_date")
                    if current_instance.get("start_date") is not None
                    else ""
                ),
                new_value=(
                    requested_data.get("start_date")
                    if requested_data.get("start_date") is not None
                    else ""
                ),
                field="start_date",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the start date to ",
                epoch=epoch,
            )
        )


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
    requested_labels = set(
        [str(lab) for lab in requested_data.get("label_ids", [])]
    )
    current_labels = set(
        [str(lab) for lab in current_instance.get("label_ids", [])]
    )

    added_labels = requested_labels - current_labels
    dropped_labels = current_labels - requested_labels

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

    # Set of dropped labels
    for dropped_label in dropped_labels:
        label = Label.objects.get(pk=dropped_label)
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=label.name,
                new_value="",
                field="labels",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="removed label ",
                old_identifier=label.id,
                new_identifier=None,
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
    dropped_assginees = current_assignees - requested_assignees

    bulk_subscribers = []
    for added_asignee in added_assignees:
        assignee = User.objects.get(pk=added_asignee)
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

    for dropped_assignee in dropped_assginees:
        assignee = User.objects.get(pk=dropped_assignee)
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=assignee.display_name,
                new_value="",
                field="assignees",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="removed assignee ",
                old_identifier=assignee.id,
                epoch=epoch,
            )
        )


def track_estimate_points(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("estimate_point") != requested_data.get(
        "estimate_point"
    ):
        old_estimate = (
            EstimatePoint.objects.filter(
                pk=current_instance.get("estimate_point")
            ).first()
            if current_instance.get("estimate_point") is not None
            else None
        )
        new_estimate = (
            EstimatePoint.objects.filter(
                pk=requested_data.get("estimate_point")
            ).first()
            if requested_data.get("estimate_point") is not None
            else None
        )
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_identifier=(
                    current_instance.get("estimate_point")
                    if current_instance.get("estimate_point") is not None
                    else None
                ),
                new_identifier=(
                    requested_data.get("estimate_point")
                    if requested_data.get("estimate_point") is not None
                    else None
                ),
                old_value=old_estimate.value if old_estimate else None,
                new_value=new_estimate.value if new_estimate else None,
                field="estimate_point",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the estimate point to ",
                epoch=epoch,
            )
        )


def track_archive_at(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if current_instance.get("archived_at") != requested_data.get(
        "archived_at"
    ):
        if requested_data.get("archived_at") is None:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="has restored the issue",
                    verb="updated",
                    actor_id=actor_id,
                    field="archived_at",
                    old_value="archive",
                    new_value="restore",
                    epoch=epoch,
                )
            )
        else:
            if requested_data.get("automation"):
                comment = "Plane has archived the issue"
                new_value = "archive"
            else:
                comment = "Actor has archived the issue"
                new_value = "manual_archive"
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment=comment,
                    verb="updated",
                    actor_id=actor_id,
                    field="archived_at",
                    old_value=None,
                    new_value=new_value,
                    epoch=epoch,
                )
            )


def track_closed_to(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    if requested_data.get("closed_to") is not None:
        updated_state = State.objects.get(
            pk=requested_data.get("closed_to"), project_id=project_id
        )
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=None,
                new_value=updated_state.name,
                field="state",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="Plane updated the state to ",
                old_identifier=None,
                new_identifier=updated_state.id,
                epoch=epoch,
            )
        )


def create_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="created the issue",
            verb="created",
            actor_id=actor_id,
            epoch=epoch,
        )
    )
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    if requested_data.get("assignee_ids") is not None:
        track_assignees(
            requested_data,
            current_instance,
            issue_id,
            project_id,
            workspace_id,
            actor_id,
            issue_activities,
            epoch,
        )


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
    ISSUE_ACTIVITY_MAPPER = {
        "name": track_name,
        "parent_id": track_parent,
        "priority": track_priority,
        "state_id": track_state,
        "description_html": track_description,
        "target_date": track_target_date,
        "start_date": track_start_date,
        "label_ids": track_labels,
        "assignee_ids": track_assignees,
        "estimate_point": track_estimate_points,
        "archived_at": track_archive_at,
        "closed_to": track_closed_to,
    }

    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
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


def delete_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    issue_activities.append(
        IssueActivity(
            project_id=project_id,
            workspace_id=workspace_id,
            comment="deleted the issue",
            verb="deleted",
            actor_id=actor_id,
            field="issue",
            epoch=epoch,
        )
    )


def create_comment_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="created a comment",
            verb="created",
            actor_id=actor_id,
            field="comment",
            new_value=requested_data.get("comment_html", ""),
            new_identifier=requested_data.get("id", None),
            issue_comment_id=requested_data.get("id", None),
            epoch=epoch,
        )
    )


def update_comment_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("comment_html") != requested_data.get(
        "comment_html"
    ):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated a comment",
                verb="updated",
                actor_id=actor_id,
                field="comment",
                old_value=current_instance.get("comment_html", ""),
                old_identifier=current_instance.get("id"),
                new_value=requested_data.get("comment_html", ""),
                new_identifier=current_instance.get("id", None),
                issue_comment_id=current_instance.get("id", None),
                epoch=epoch,
            )
        )


def delete_comment_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="deleted the comment",
            verb="deleted",
            actor_id=actor_id,
            field="comment",
            epoch=epoch,
        )
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
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    # Updated Records:
    updated_records = current_instance.get("updated_cycle_issues", [])
    created_records = json.loads(
        current_instance.get("created_cycle_issues", [])
    )

    for updated_record in updated_records:
        old_cycle = Cycle.objects.filter(
            pk=updated_record.get("old_cycle_id", None)
        ).first()
        new_cycle = Cycle.objects.filter(
            pk=updated_record.get("new_cycle_id", None)
        ).first()
        issue = Issue.objects.filter(pk=updated_record.get("issue_id")).first()
        if issue:
            issue.updated_at = timezone.now()
            issue.save(update_fields=["updated_at"])

        issue_activities.append(
            IssueActivity(
                issue_id=updated_record.get("issue_id"),
                actor_id=actor_id,
                verb="updated",
                old_value=old_cycle.name,
                new_value=new_cycle.name,
                field="cycles",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"updated cycle from {old_cycle.name} to {new_cycle.name}",
                old_identifier=old_cycle.id,
                new_identifier=new_cycle.id,
                epoch=epoch,
            )
        )

    for created_record in created_records:
        cycle = Cycle.objects.filter(
            pk=created_record.get("fields").get("cycle")
        ).first()
        issue = Issue.objects.filter(
            pk=created_record.get("fields").get("issue")
        ).first()
        if issue:
            issue.updated_at = timezone.now()
            issue.save(update_fields=["updated_at"])

        issue_activities.append(
            IssueActivity(
                issue_id=created_record.get("fields").get("issue"),
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
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    cycle_id = requested_data.get("cycle_id", "")
    cycle_name = requested_data.get("cycle_name", "")
    cycle = Cycle.objects.filter(pk=cycle_id).first()
    issues = requested_data.get("issues")

    for issue in issues:
        current_issue = Issue.objects.filter(pk=issue).first()
        if issue:
            current_issue.updated_at = timezone.now()
            current_issue.save(update_fields=["updated_at"])
        issue_activities.append(
            IssueActivity(
                issue_id=issue,
                actor_id=actor_id,
                verb="deleted",
                old_value=cycle.name if cycle is not None else cycle_name,
                new_value="",
                field="cycles",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"removed this issue from {cycle.name if cycle is not None else cycle_name}",
                old_identifier=cycle_id if cycle_id is not None else None,
                epoch=epoch,
            )
        )


def create_module_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    module = Module.objects.filter(pk=requested_data.get("module_id")).first()
    issue = Issue.objects.filter(pk=issue_id).first()
    if issue:
        issue.updated_at = timezone.now()
        issue.save(update_fields=["updated_at"])
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            actor_id=actor_id,
            verb="created",
            old_value="",
            new_value=module.name,
            field="modules",
            project_id=project_id,
            workspace_id=workspace_id,
            comment=f"added module {module.name}",
            new_identifier=requested_data.get("module_id"),
            epoch=epoch,
        )
    )


def delete_module_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    module_name = current_instance.get("module_name")
    current_issue = Issue.objects.filter(pk=issue_id).first()
    if current_issue:
        current_issue.updated_at = timezone.now()
        current_issue.save(update_fields=["updated_at"])
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            actor_id=actor_id,
            verb="deleted",
            old_value=module_name,
            new_value="",
            field="modules",
            project_id=project_id,
            workspace_id=workspace_id,
            comment=f"removed this issue from {module_name}",
            old_identifier=(
                requested_data.get("module_id")
                if requested_data.get("module_id") is not None
                else None
            ),
            epoch=epoch,
        )
    )


def create_link_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    actor_id,
    workspace_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="created a link",
            verb="created",
            actor_id=actor_id,
            field="link",
            new_value=requested_data.get("url", ""),
            new_identifier=requested_data.get("id", None),
            epoch=epoch,
        )
    )


def update_link_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("url") != requested_data.get("url"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated a link",
                verb="updated",
                actor_id=actor_id,
                field="link",
                old_value=current_instance.get("url", ""),
                old_identifier=current_instance.get("id"),
                new_value=requested_data.get("url", ""),
                new_identifier=current_instance.get("id", None),
                epoch=epoch,
            )
        )


def delete_link_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="deleted the link",
            verb="deleted",
            actor_id=actor_id,
            field="link",
            old_value=current_instance.get("url", ""),
            new_value="",
            epoch=epoch,
        )
    )


def create_attachment_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    actor_id,
    workspace_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="created an attachment",
            verb="created",
            actor_id=actor_id,
            field="attachment",
            new_value=current_instance.get("asset", ""),
            new_identifier=current_instance.get("id", None),
            epoch=epoch,
        )
    )


def delete_attachment_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="deleted the attachment",
            verb="deleted",
            actor_id=actor_id,
            field="attachment",
            epoch=epoch,
        )
    )


def create_issue_reaction_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    if requested_data and requested_data.get("reaction") is not None:
        issue_reaction = (
            IssueReaction.objects.filter(
                reaction=requested_data.get("reaction"),
                project_id=project_id,
                actor_id=actor_id,
            )
            .values_list("id", flat=True)
            .first()
        )
        if issue_reaction is not None:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor_id=actor_id,
                    verb="created",
                    old_value=None,
                    new_value=requested_data.get("reaction"),
                    field="reaction",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="added the reaction",
                    old_identifier=None,
                    new_identifier=issue_reaction,
                    epoch=epoch,
                )
            )


def delete_issue_reaction_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance and current_instance.get("reaction") is not None:
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="deleted",
                old_value=current_instance.get("reaction"),
                new_value=None,
                field="reaction",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="removed the reaction",
                old_identifier=current_instance.get("identifier"),
                new_identifier=None,
                epoch=epoch,
            )
        )


def create_comment_reaction_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    if requested_data and requested_data.get("reaction") is not None:
        comment_reaction_id, comment_id = (
            CommentReaction.objects.filter(
                reaction=requested_data.get("reaction"),
                project_id=project_id,
                actor_id=actor_id,
            )
            .values_list("id", "comment__id")
            .first()
        )
        comment = IssueComment.objects.get(
            pk=comment_id, project_id=project_id
        )
        if (
            comment is not None
            and comment_reaction_id is not None
            and comment_id is not None
        ):
            issue_activities.append(
                IssueActivity(
                    issue_id=comment.issue_id,
                    actor_id=actor_id,
                    verb="created",
                    old_value=None,
                    new_value=requested_data.get("reaction"),
                    field="reaction",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="added the reaction",
                    old_identifier=None,
                    new_identifier=comment_reaction_id,
                    epoch=epoch,
                )
            )


def delete_comment_reaction_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance and current_instance.get("reaction") is not None:
        issue_id = (
            IssueComment.objects.filter(
                pk=current_instance.get("comment_id"), project_id=project_id
            )
            .values_list("issue_id", flat=True)
            .first()
        )
        if issue_id is not None:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor_id=actor_id,
                    verb="deleted",
                    old_value=current_instance.get("reaction"),
                    new_value=None,
                    field="reaction",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="removed the reaction",
                    old_identifier=current_instance.get("identifier"),
                    new_identifier=None,
                    epoch=epoch,
                )
            )


def create_issue_vote_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    if requested_data and requested_data.get("vote") is not None:
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=None,
                new_value=requested_data.get("vote"),
                field="vote",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="added the vote",
                old_identifier=None,
                new_identifier=None,
                epoch=epoch,
            )
        )


def delete_issue_vote_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance and current_instance.get("vote") is not None:
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="deleted",
                old_value=current_instance.get("vote"),
                new_value=None,
                field="vote",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="removed the vote",
                old_identifier=current_instance.get("identifier"),
                new_identifier=None,
                epoch=epoch,
            )
        )


def create_issue_relation_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance is None and requested_data.get("issues") is not None:
        for related_issue in requested_data.get("issues"):
            issue = Issue.objects.get(pk=related_issue)
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor_id=actor_id,
                    verb="updated",
                    old_value="",
                    new_value=f"{issue.project.identifier}-{issue.sequence_id}",
                    field=requested_data.get("relation_type"),
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment=f"added {requested_data.get('relation_type')} relation",
                    old_identifier=related_issue,
                )
            )
            issue = Issue.objects.get(pk=issue_id)
            issue_activities.append(
                IssueActivity(
                    issue_id=related_issue,
                    actor_id=actor_id,
                    verb="updated",
                    old_value="",
                    new_value=f"{issue.project.identifier}-{issue.sequence_id}",
                    field=(
                        "blocking"
                        if requested_data.get("relation_type") == "blocked_by"
                        else (
                            "blocked_by"
                            if requested_data.get("relation_type")
                            == "blocking"
                            else requested_data.get("relation_type")
                        )
                    ),
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment=f'added {"blocking" if requested_data.get("relation_type") == "blocked_by" else ("blocked_by" if requested_data.get("relation_type") == "blocking" else requested_data.get("relation_type")),} relation',
                    old_identifier=issue_id,
                    epoch=epoch,
                )
            )


def delete_issue_relation_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    issue = Issue.objects.get(pk=requested_data.get("related_issue"))
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            actor_id=actor_id,
            verb="deleted",
            old_value=f"{issue.project.identifier}-{issue.sequence_id}",
            new_value="",
            field=requested_data.get("relation_type"),
            project_id=project_id,
            workspace_id=workspace_id,
            comment=f"deleted {requested_data.get('relation_type')} relation",
            old_identifier=requested_data.get("related_issue"),
            epoch=epoch,
        )
    )
    issue = Issue.objects.get(pk=issue_id)
    issue_activities.append(
        IssueActivity(
            issue_id=requested_data.get("related_issue"),
            actor_id=actor_id,
            verb="deleted",
            old_value=f"{issue.project.identifier}-{issue.sequence_id}",
            new_value="",
            field=(
                "blocking"
                if requested_data.get("relation_type") == "blocked_by"
                else (
                    "blocked_by"
                    if requested_data.get("relation_type") == "blocking"
                    else requested_data.get("relation_type")
                )
            ),
            project_id=project_id,
            workspace_id=workspace_id,
            comment=f'deleted {requested_data.get("relation_type")} relation',
            old_identifier=requested_data.get("related_issue"),
            epoch=epoch,
        )
    )


def create_draft_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="drafted the issue",
            field="draft",
            verb="created",
            actor_id=actor_id,
            epoch=epoch,
        )
    )


def update_draft_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if (
        requested_data.get("is_draft") is not None
        and requested_data.get("is_draft") is False
    ):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment="created the issue",
                verb="updated",
                actor_id=actor_id,
                epoch=epoch,
            )
        )
    else:
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the draft issue",
                field="draft",
                verb="updated",
                actor_id=actor_id,
                epoch=epoch,
            )
        )


def delete_draft_issue_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    issue_activities.append(
        IssueActivity(
            project_id=project_id,
            workspace_id=workspace_id,
            comment="deleted the draft issue",
            field="draft",
            verb="deleted",
            actor_id=actor_id,
            epoch=epoch,
        )
    )


def create_inbox_activity(
    requested_data,
    current_instance,
    issue_id,
    project_id,
    workspace_id,
    actor_id,
    issue_activities,
    epoch,
):
    requested_data = (
        json.loads(requested_data) if requested_data is not None else None
    )
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    status_dict = {
        -2: "Pending",
        -1: "Rejected",
        0: "Snoozed",
        1: "Accepted",
        2: "Duplicate",
    }
    if requested_data.get("status") is not None:
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the inbox status",
                field="inbox",
                verb=requested_data.get("status"),
                actor_id=actor_id,
                epoch=epoch,
                old_value=status_dict.get(current_instance.get("status")),
                new_value=status_dict.get(requested_data.get("status")),
            )
        )


# Receive message from room group
@shared_task
def issue_activity(
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
            "issue.activity.created": create_issue_activity,
            "issue.activity.updated": update_issue_activity,
            "issue.activity.deleted": delete_issue_activity,
            "comment.activity.created": create_comment_activity,
            "comment.activity.updated": update_comment_activity,
            "comment.activity.deleted": delete_comment_activity,
            "cycle.activity.created": create_cycle_issue_activity,
            "cycle.activity.deleted": delete_cycle_issue_activity,
            "module.activity.created": create_module_issue_activity,
            "module.activity.deleted": delete_module_issue_activity,
            "link.activity.created": create_link_activity,
            "link.activity.updated": update_link_activity,
            "link.activity.deleted": delete_link_activity,
            "attachment.activity.created": create_attachment_activity,
            "attachment.activity.deleted": delete_attachment_activity,
            "issue_relation.activity.created": create_issue_relation_activity,
            "issue_relation.activity.deleted": delete_issue_relation_activity,
            "issue_reaction.activity.created": create_issue_reaction_activity,
            "issue_reaction.activity.deleted": delete_issue_reaction_activity,
            "comment_reaction.activity.created": create_comment_reaction_activity,
            "comment_reaction.activity.deleted": delete_comment_reaction_activity,
            "issue_vote.activity.created": create_issue_vote_activity,
            "issue_vote.activity.deleted": delete_issue_vote_activity,
            "issue_draft.activity.created": create_draft_issue_activity,
            "issue_draft.activity.updated": update_draft_issue_activity,
            "issue_draft.activity.deleted": delete_draft_issue_activity,
            "inbox.activity.created": create_inbox_activity,
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
        issue_activities_created = IssueActivity.objects.bulk_create(
            issue_activities
        )
        # Post the updates to segway for integrations and webhooks
        if len(issue_activities_created):
            # Don't send activities if the actor is a bot
            try:
                if settings.PROXY_BASE_URL:
                    for issue_activity in issue_activities_created:
                        headers = {"Content-Type": "application/json"}
                        issue_activity_json = json.dumps(
                            IssueActivitySerializer(issue_activity).data,
                            cls=DjangoJSONEncoder,
                        )
                        _ = requests.post(
                            f"{settings.PROXY_BASE_URL}/hooks/workspaces/{str(issue_activity.workspace_id)}/projects/{str(issue_activity.project_id)}/issues/{str(issue_activity.issue_id)}/issue-activity-hooks/",
                            json=issue_activity_json,
                            headers=headers,
                        )
            except Exception as e:
                log_exception(e)

            for activity in issue_activities_created:
                webhook_activity.delay(
                    event=(
                        "issue_comment"
                        if activity.field == "comment"
                        else "inbox_issue" if inbox else "issue"
                    ),
                    event_id=(
                        activity.issue_comment_id
                        if activity.field == "comment"
                        else inbox if inbox else activity.issue_id
                    ),
                    verb=activity.verb,
                    field=(
                        "description"
                        if activity.field == "comment"
                        else activity.field
                    ),
                    old_value=(
                        activity.old_value
                        if activity.old_value != ""
                        else None
                    ),
                    new_value=(
                        activity.new_value
                        if activity.new_value != ""
                        else None
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
                    IssueActivitySerializer(
                        issue_activities_created, many=True
                    ).data,
                    cls=DjangoJSONEncoder,
                ),
                requested_data=requested_data,
                current_instance=current_instance,
            )

        return
    except Exception as e:
        log_exception(e)
        return
