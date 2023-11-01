# Python imports
import json
import requests

# Django imports
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third Party imports
from celery import shared_task
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import (
    User,
    Issue,
    Project,
    Label,
    IssueActivity,
    State,
    Cycle,
    Module,
    IssueSubscriber,
    Notification,
    IssueAssignee,
    IssueReaction,
    CommentReaction,
    IssueComment,
)
from plane.api.serializers import IssueActivitySerializer
from plane.bgtasks.notification_task import notifications


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
                comment=f"updated the name to",
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
                    comment=f"updated the description to",
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
    if current_instance.get("parent") != requested_data.get("parent"):
        old_parent = Issue.objects.filter(pk=current_instance.get("parent")).first()
        new_parent = Issue.objects.filter(pk=requested_data.get("parent")).first()

        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=f"{old_parent.project.identifier}-{old_parent.sequence_id}"
                if old_parent is not None
                else "",
                new_value=f"{new_parent.project.identifier}-{new_parent.sequence_id}"
                if new_parent is not None
                else "",
                field="parent",
                project_id=project_id,
                workspace=workspace_id,
                comment=f"updated the parent issue to",
                old_identifier=old_parent.id if old_parent is not None else None,
                new_identifier=new_parent.id if new_parent is not None else None,
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
                comment=f"updated the priority to",
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
    if current_instance.get("state") != requested_data.get("state"):
        new_state = State.objects.get(pk=requested_data.get("state", None))
        old_state = State.objects.get(pk=current_instance.get("state", None))

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
                comment=f"updated the state to",
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
    if current_instance.get("target_date") != requested_data.get("target_date"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("target_date")
                if current_instance.get("target_date") is not None
                else "",
                new_value=requested_data.get("target_date")
                if requested_data.get("target_date") is not None
                else "",
                field="target_date",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"updated the target date to",
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
                old_value=current_instance.get("start_date")
                if current_instance.get("start_date") is not None
                else "",
                new_value=requested_data.get("start_date")
                if requested_data.get("start_date") is not None
                else "",
                field="start_date",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"updated the start date to ",
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
    requested_labels = set([str(lab) for lab in requested_data.get("labels", [])])
    current_labels = set([str(lab) for lab in current_instance.get("labels", [])])

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
                comment=f"removed label ",
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
    requested_assignees = set(
        [str(asg) for asg in requested_data.get("assignees", [])]
    )
    current_assignees = set([str(asg) for asg in current_instance.get("assignees", [])])

    added_assignees = requested_assignees - current_assignees
    dropped_assginees = current_assignees - requested_assignees

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
                comment=f"added assignee ",
                new_identifier=assignee.id,
                epoch=epoch,
            )
        )

    for dropped_assignee in dropped_assginees:
        assignee = User.objects.get(pk=dropped_assignee)
        issue_activities.append(
            issue_id=issue_id,
            actor_id=actor_id,
            verb="updated",
            old_value=assignee.display_name,
            new_value="",
            field="assignees",
            project_id=project_id,
            workspace_id=workspace_id,
            comment=f"removed assignee ",
            old_identifier=assignee.id,
            epoch=epoch,
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
    if current_instance.get("estimate_point") != requested_data.get("estimate_point"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("estimate_point")
                if current_instance.get("estimate_point") is not None
                else "",
                new_value=requested_data.get("estimate_point")
                if requested_data.get("estimate_point") is not None
                else "",
                field="estimate_point",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"updated the estimate point to ",
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
    if current_instance.get("archived_at") != requested_data.get("archived_at"):
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
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="Plane has archived the issue",
                    verb="updated",
                    actor_id=actor_id,
                    field="archived_at",
                    old_value=None,
                    new_value="archive",
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
                comment=f"Plane updated the state to ",
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
            comment=f"created the issue",
            verb="created",
            actor_id=actor_id,
            epoch=epoch,
        )
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
        "parent": track_parent,
        "priority": track_priority,
        "state": track_state,
        "description_html": track_description,
        "target_date": track_target_date,
        "start_date": track_start_date,
        "labels": track_labels,
        "assignees": track_assignees,
        "estimate_point": track_estimate_points,
        "archived_at": track_archive_at,
        "closed_to": track_closed_to,
    }

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    for key in requested_data:
        func = ISSUE_ACTIVITY_MAPPER.get(key, None)
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
            comment=f"deleted the issue",
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment=f"created a comment",
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("comment_html") != requested_data.get("comment_html"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"updated a comment",
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
            comment=f"deleted the comment",
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    # Updated Records:
    updated_records = current_instance.get("updated_cycle_issues", [])
    created_records = json.loads(current_instance.get("created_cycle_issues", []))

    for updated_record in updated_records:
        old_cycle = Cycle.objects.filter(
            pk=updated_record.get("old_cycle_id", None)
        ).first()
        new_cycle = Cycle.objects.filter(
            pk=updated_record.get("new_cycle_id", None)
        ).first()

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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    cycle_id = requested_data.get("cycle_id", "")
    cycle = Cycle.objects.filter(pk=cycle_id).first()
    issues = requested_data.get("issues")

    for issue in issues:
        issue_activities.append(
            IssueActivity(
                issue_id=issue,
                actor_id=actor_id,
                verb="deleted",
                old_value=cycle.name if cycle is not None else "",
                new_value="",
                field="cycles",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"removed this issue from {cycle.name if cycle is not None else None}",
                old_identifier=cycle.id if cycle is not None else None,
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    # Updated Records:
    updated_records = current_instance.get("updated_module_issues", [])
    created_records = json.loads(current_instance.get("created_module_issues", []))

    for updated_record in updated_records:
        old_module = Module.objects.filter(
            pk=updated_record.get("old_module_id", None)
        ).first()
        new_module = Module.objects.filter(
            pk=updated_record.get("new_module_id", None)
        ).first()

        issue_activities.append(
            IssueActivity(
                issue_id=updated_record.get("issue_id"),
                actor_id=actor_id,
                verb="updated",
                old_value=old_module.name,
                new_value=new_module.name,
                field="modules",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"updated module to ",
                old_identifier=old_module.id,
                new_identifier=new_module.id,
                epoch=epoch,
            )
        )

    for created_record in created_records:
        module = Module.objects.filter(
            pk=created_record.get("fields").get("module")
        ).first()
        issue_activities.append(
            IssueActivity(
                issue_id=created_record.get("fields").get("issue"),
                actor_id=actor_id,
                verb="created",
                old_value="",
                new_value=module.name,
                field="modules",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"added module {module.name}",
                new_identifier=module.id,
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    module_id = requested_data.get("module_id", "")
    module = Module.objects.filter(pk=module_id).first()
    issues = requested_data.get("issues")

    for issue in issues:
        issue_activities.append(
            IssueActivity(
                issue_id=issue,
                actor_id=actor_id,
                verb="deleted",
                old_value=module.name if module is not None else "",
                new_value="",
                field="modules",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"removed this issue from ",
                old_identifier=module.id if module is not None else None,
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment=f"created a link",
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("url") != requested_data.get("url"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"updated a link",
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
            comment=f"deleted the link",
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment=f"created an attachment",
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
            comment=f"deleted the attachment",
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
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
        comment = IssueComment.objects.get(pk=comment_id, project_id=project_id)
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    if requested_data and requested_data.get("vote") is not None:
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="created",
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance is None and requested_data.get("related_list") is not None:
        for issue_relation in requested_data.get("related_list"):
            if issue_relation.get("relation_type") == "blocked_by":
                relation_type = "blocking"
            else:
                relation_type = issue_relation.get("relation_type")
            issue = Issue.objects.get(pk=issue_relation.get("issue"))
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_relation.get("related_issue"),
                    actor_id=actor_id,
                    verb="created",
                    old_value="",
                    new_value=f"{issue.project.identifier}-{issue.sequence_id}",
                    field=relation_type,
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment=f"added {relation_type} relation",
                    old_identifier=issue_relation.get("issue"),
                )
            )
            issue = Issue.objects.get(pk=issue_relation.get("related_issue"))
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_relation.get("issue"),
                    actor_id=actor_id,
                    verb="created",
                    old_value="",
                    new_value=f"{issue.project.identifier}-{issue.sequence_id}",
                    field=f'{issue_relation.get("relation_type")}',
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment=f'added {issue_relation.get("relation_type")} relation',
                    old_identifier=issue_relation.get("related_issue"),
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance is not None and requested_data.get("related_list") is None:
        if current_instance.get("relation_type") == "blocked_by":
            relation_type = "blocking"
        else:
            relation_type = current_instance.get("relation_type")
        issue = Issue.objects.get(pk=current_instance.get("issue"))
        issue_activities.append(
            IssueActivity(
                issue_id=current_instance.get("related_issue"),
                actor_id=actor_id,
                verb="deleted",
                old_value=f"{issue.project.identifier}-{issue.sequence_id}",
                new_value="",
                field=relation_type,
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"deleted {relation_type} relation",
                old_identifier=current_instance.get("issue"),
                epoch=epoch,
            )
        )
        issue = Issue.objects.get(pk=current_instance.get("related_issue"))
        issue_activities.append(
            IssueActivity(
                issue_id=current_instance.get("issue"),
                actor_id=actor_id,
                verb="deleted",
                old_value=f"{issue.project.identifier}-{issue.sequence_id}",
                new_value="",
                field=f'{current_instance.get("relation_type")}',
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f'deleted {current_instance.get("relation_type")} relation',
                old_identifier=current_instance.get("related_issue"),
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
            comment=f"drafted the issue",
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
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if (
        requested_data.get("is_draft") is not None
        and requested_data.get("is_draft") == False
    ):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"created the issue",
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
                comment=f"updated the draft issue",
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
            comment=f"deleted the draft issue",
            field="draft",
            verb="deleted",
            actor_id=actor_id,
            epoch=epoch,
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
):
    try:
        issue_activities = []

        project = Project.objects.get(pk=project_id)
        issue = Issue.objects.filter(pk=issue_id).first()
        workspace_id = project.workspace_id

        if issue is not None:
            try:
                issue.updated_at = timezone.now()
                issue.save(update_fields=["updated_at"])
            except Exception as e:
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
                capture_exception(e)

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
            current_instance=current_instance
        )

        return
    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
