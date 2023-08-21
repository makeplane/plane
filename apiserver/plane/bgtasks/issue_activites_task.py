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
)
from plane.api.serializers import IssueActivitySerializer


# Track Chnages in name
def track_name(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if current_instance.get("name") != requested_data.get("name"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor=actor,
                verb="updated",
                old_value=current_instance.get("name"),
                new_value=requested_data.get("name"),
                field="name",
                project=project,
                workspace=project.workspace,
                comment=f"updated the name to {requested_data.get('name')}",
            )
        )


# Track changes in parent issue
def track_parent(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if current_instance.get("parent") != requested_data.get("parent"):
        if requested_data.get("parent") == None:
            old_parent = Issue.objects.get(pk=current_instance.get("parent"))
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=f"{old_parent.project.identifier}-{old_parent.sequence_id}",
                    new_value=None,
                    field="parent",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the parent issue to None",
                    old_identifier=old_parent.id,
                    new_identifier=None,
                )
            )
        else:
            new_parent = Issue.objects.get(pk=requested_data.get("parent"))
            old_parent = Issue.objects.filter(pk=current_instance.get("parent")).first()
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=f"{old_parent.project.identifier}-{old_parent.sequence_id}"
                    if old_parent is not None
                    else None,
                    new_value=f"{new_parent.project.identifier}-{new_parent.sequence_id}",
                    field="parent",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the parent issue to {new_parent.name}",
                    old_identifier=old_parent.id if old_parent is not None else None,
                    new_identifier=new_parent.id,
                )
            )


# Track changes in priority
def track_priority(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if current_instance.get("priority") != requested_data.get("priority"):
        if requested_data.get("priority") == None:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=current_instance.get("priority"),
                    new_value=None,
                    field="priority",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the priority to None",
                )
            )
        else:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=current_instance.get("priority"),
                    new_value=requested_data.get("priority"),
                    field="priority",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the priority to {requested_data.get('priority')}",
                )
            )


# Track chnages in state of the issue
def track_state(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if current_instance.get("state") != requested_data.get("state"):
        new_state = State.objects.get(pk=requested_data.get("state", None))
        old_state = State.objects.get(pk=current_instance.get("state", None))

        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor=actor,
                verb="updated",
                old_value=old_state.name,
                new_value=new_state.name,
                field="state",
                project=project,
                workspace=project.workspace,
                comment=f"updated the state to {new_state.name}",
                old_identifier=old_state.id,
                new_identifier=new_state.id,
            )
        )


# Track issue description
def track_description(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if current_instance.get("description_html") != requested_data.get(
        "description_html"
    ):
        last_activity = IssueActivity.objects.filter(issue_id=issue_id).order_by("-created_at").first()
        if(last_activity is not None and last_activity.field == "description" and actor.id == last_activity.actor_id):
            last_activity.created_at = timezone.now()
            last_activity.save(update_fields=["created_at"])
        else:
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value=current_instance.get("description_html"),
                        new_value=requested_data.get("description_html"),
                        field="description",
                        project=project,
                        workspace=project.workspace,
                        comment=f"updated the description to {requested_data.get('description_html')}",
                    )
                )


# Track changes in issue target date
def track_target_date(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if current_instance.get("target_date") != requested_data.get("target_date"):
        if requested_data.get("target_date") == None:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=current_instance.get("target_date"),
                    new_value=requested_data.get("target_date"),
                    field="target_date",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the target date to None",
                )
            )
        else:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=current_instance.get("target_date"),
                    new_value=requested_data.get("target_date"),
                    field="target_date",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the target date to {requested_data.get('target_date')}",
                )
            )


# Track changes in issue start date
def track_start_date(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if current_instance.get("start_date") != requested_data.get("start_date"):
        if requested_data.get("start_date") == None:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=current_instance.get("start_date"),
                    new_value=requested_data.get("start_date"),
                    field="start_date",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the start date to None",
                )
            )
        else:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=current_instance.get("start_date"),
                    new_value=requested_data.get("start_date"),
                    field="start_date",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the start date to {requested_data.get('start_date')}",
                )
            )


# Track changes in issue labels
def track_labels(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    # Label Addition
    if len(requested_data.get("labels_list")) > len(current_instance.get("labels")):
        for label in requested_data.get("labels_list"):
            if label not in current_instance.get("labels"):
                label = Label.objects.get(pk=label)
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value="",
                        new_value=label.name,
                        field="labels",
                        project=project,
                        workspace=project.workspace,
                        comment=f"added label {label.name}",
                        new_identifier=label.id,
                        old_identifier=None,
                    )
                )

    # Label Removal
    if len(requested_data.get("labels_list")) < len(current_instance.get("labels")):
        for label in current_instance.get("labels"):
            if label not in requested_data.get("labels_list"):
                label = Label.objects.get(pk=label)
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value=label.name,
                        new_value="",
                        field="labels",
                        project=project,
                        workspace=project.workspace,
                        comment=f"removed label {label.name}",
                        old_identifier=label.id,
                        new_identifier=None,
                    )
                )


# Track changes in issue assignees
def track_assignees(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    # Assignee Addition
    if len(requested_data.get("assignees_list")) > len(
        current_instance.get("assignees")
    ):
        for assignee in requested_data.get("assignees_list"):
            if assignee not in current_instance.get("assignees"):
                assignee = User.objects.get(pk=assignee)
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value="",
                        new_value=assignee.display_name,
                        field="assignees",
                        project=project,
                        workspace=project.workspace,
                        comment=f"added assignee {assignee.display_name}",
                        new_identifier=assignee.id,
                    )
                )

    # Assignee Removal
    if len(requested_data.get("assignees_list")) < len(
        current_instance.get("assignees")
    ):
        for assignee in current_instance.get("assignees"):
            if assignee not in requested_data.get("assignees_list"):
                assignee = User.objects.get(pk=assignee)
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value=assignee.display_name,
                        new_value="",
                        field="assignees",
                        project=project,
                        workspace=project.workspace,
                        comment=f"removed assignee {assignee.display_name}",
                        old_identifier=assignee.id,
                    )
                )


# Track changes in blocking issues
def track_blocks(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if len(requested_data.get("blocks_list")) > len(
        current_instance.get("blocked_issues")
    ):
        for block in requested_data.get("blocks_list"):
            if (
                len(
                    [
                        blocked
                        for blocked in current_instance.get("blocked_issues")
                        if blocked.get("block") == block
                    ]
                )
                == 0
            ):
                issue = Issue.objects.get(pk=block)
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value="",
                        new_value=f"{issue.project.identifier}-{issue.sequence_id}",
                        field="blocks",
                        project=project,
                        workspace=project.workspace,
                        comment=f"added blocking issue {project.identifier}-{issue.sequence_id}",
                        new_identifier=issue.id,
                    )
                )

    # Blocked Issue Removal
    if len(requested_data.get("blocks_list")) < len(
        current_instance.get("blocked_issues")
    ):
        for blocked in current_instance.get("blocked_issues"):
            if blocked.get("block") not in requested_data.get("blocks_list"):
                issue = Issue.objects.get(pk=blocked.get("block"))
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value=f"{issue.project.identifier}-{issue.sequence_id}",
                        new_value="",
                        field="blocks",
                        project=project,
                        workspace=project.workspace,
                        comment=f"removed blocking issue {project.identifier}-{issue.sequence_id}",
                        old_identifier=issue.id,
                    )
                )


# Track changes in blocked_by issues
def track_blockings(
    requested_data,
    current_instance,
    issue_id,
    project,
    actor,
    issue_activities,
):
    if len(requested_data.get("blockers_list")) > len(
        current_instance.get("blocker_issues")
    ):
        for block in requested_data.get("blockers_list"):
            if (
                len(
                    [
                        blocked
                        for blocked in current_instance.get("blocker_issues")
                        if blocked.get("blocked_by") == block
                    ]
                )
                == 0
            ):
                issue = Issue.objects.get(pk=block)
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value="",
                        new_value=f"{issue.project.identifier}-{issue.sequence_id}",
                        field="blocking",
                        project=project,
                        workspace=project.workspace,
                        comment=f"added blocked by issue {project.identifier}-{issue.sequence_id}",
                        new_identifier=issue.id,
                    )
                )

    # Blocked Issue Removal
    if len(requested_data.get("blockers_list")) < len(
        current_instance.get("blocker_issues")
    ):
        for blocked in current_instance.get("blocker_issues"):
            if blocked.get("blocked_by") not in requested_data.get("blockers_list"):
                issue = Issue.objects.get(pk=blocked.get("blocked_by"))
                issue_activities.append(
                    IssueActivity(
                        issue_id=issue_id,
                        actor=actor,
                        verb="updated",
                        old_value=f"{issue.project.identifier}-{issue.sequence_id}",
                        new_value="",
                        field="blocking",
                        project=project,
                        workspace=project.workspace,
                        comment=f"removed blocked by issue {project.identifier}-{issue.sequence_id}",
                        old_identifier=issue.id,
                    )
                )


def create_issue_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project=project,
            workspace=project.workspace,
            comment=f"created the issue",
            verb="created",
            actor=actor,
        )
    )


def track_estimate_points(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    if current_instance.get("estimate_point") != requested_data.get("estimate_point"):
        if requested_data.get("estimate_point") == None:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=current_instance.get("estimate_point"),
                    new_value=requested_data.get("estimate_point"),
                    field="estimate_point",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the estimate point to None",
                )
            )
        else:
            issue_activities.append(
                IssueActivity(
                    issue_id=issue_id,
                    actor=actor,
                    verb="updated",
                    old_value=current_instance.get("estimate_point"),
                    new_value=requested_data.get("estimate_point"),
                    field="estimate_point",
                    project=project,
                    workspace=project.workspace,
                    comment=f"updated the estimate point to {requested_data.get('estimate_point')}",
                )
            )


def track_archive_at(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    if requested_data.get("archived_at") is None:
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project=project,
                workspace=project.workspace,
                comment=f"has restored the issue",
                verb="updated",
                actor=actor,
                field="archived_at",
                old_value="archive",
                new_value="restore",
            )
        )
    else:
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project=project,
                workspace=project.workspace,
                comment=f"Plane has archived the issue",
                verb="updated",
                actor=actor,
                field="archived_at",
                old_value=None,
                new_value="archive",
            )
        )


def track_closed_to(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    if requested_data.get("closed_to") is not None:
        updated_state = State.objects.get(
            pk=requested_data.get("closed_to"), project=project
        )

        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor=actor,
                verb="updated",
                old_value=None,
                new_value=updated_state.name,
                field="state",
                project=project,
                workspace=project.workspace,
                comment=f"Plane updated the state to {updated_state.name}",
                old_identifier=None,
                new_identifier=updated_state.id,
            )
        )


def update_issue_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    ISSUE_ACTIVITY_MAPPER = {
        "name": track_name,
        "parent": track_parent,
        "priority": track_priority,
        "state": track_state,
        "description": track_description,
        "target_date": track_target_date,
        "start_date": track_start_date,
        "labels_list": track_labels,
        "assignees_list": track_assignees,
        "blocks_list": track_blocks,
        "blockers_list": track_blockings,
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
                requested_data,
                current_instance,
                issue_id,
                project,
                actor,
                issue_activities,
            )


def delete_issue_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    issue_activities.append(
        IssueActivity(
            project=project,
            workspace=project.workspace,
            comment=f"deleted the issue",
            verb="deleted",
            actor=actor,
            field="issue",
        )
    )


def create_comment_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project=project,
            workspace=project.workspace,
            comment=f"created a comment",
            verb="created",
            actor=actor,
            field="comment",
            new_value=requested_data.get("comment_html", ""),
            new_identifier=requested_data.get("id", None),
            issue_comment_id=requested_data.get("id", None),
        )
    )


def update_comment_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("comment_html") != requested_data.get("comment_html"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project=project,
                workspace=project.workspace,
                comment=f"updated a comment",
                verb="updated",
                actor=actor,
                field="comment",
                old_value=current_instance.get("comment_html", ""),
                old_identifier=current_instance.get("id"),
                new_value=requested_data.get("comment_html", ""),
                new_identifier=current_instance.get("id", None),
                issue_comment_id=current_instance.get("id", None),
            )
        )


def delete_comment_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project=project,
            workspace=project.workspace,
            comment=f"deleted the comment",
            verb="deleted",
            actor=actor,
            field="comment",
        )
    )


def create_cycle_issue_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
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
                actor=actor,
                verb="updated",
                old_value=old_cycle.name,
                new_value=new_cycle.name,
                field="cycles",
                project=project,
                workspace=project.workspace,
                comment=f"updated cycle from {old_cycle.name} to {new_cycle.name}",
                old_identifier=old_cycle.id,
                new_identifier=new_cycle.id,
            )
        )

    for created_record in created_records:
        cycle = Cycle.objects.filter(
            pk=created_record.get("fields").get("cycle")
        ).first()

        issue_activities.append(
            IssueActivity(
                issue_id=created_record.get("fields").get("issue"),
                actor=actor,
                verb="created",
                old_value="",
                new_value=cycle.name,
                field="cycles",
                project=project,
                workspace=project.workspace,
                comment=f"added cycle {cycle.name}",
                new_identifier=cycle.id,
            )
        )


def delete_cycle_issue_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
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
                actor=actor,
                verb="deleted",
                old_value=cycle.name if cycle is not None else "",
                new_value="",
                field="cycles",
                project=project,
                workspace=project.workspace,
                comment=f"removed this issue from {cycle.name if cycle is not None else None}",
                old_identifier=cycle.id if cycle is not None else None,
            )
        )


def create_module_issue_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
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
                actor=actor,
                verb="updated",
                old_value=old_module.name,
                new_value=new_module.name,
                field="modules",
                project=project,
                workspace=project.workspace,
                comment=f"updated module from {old_module.name} to {new_module.name}",
                old_identifier=old_module.id,
                new_identifier=new_module.id,
            )
        )

    for created_record in created_records:
        module = Module.objects.filter(
            pk=created_record.get("fields").get("module")
        ).first()
        issue_activities.append(
            IssueActivity(
                issue_id=created_record.get("fields").get("issue"),
                actor=actor,
                verb="created",
                old_value="",
                new_value=module.name,
                field="modules",
                project=project,
                workspace=project.workspace,
                comment=f"added module {module.name}",
                new_identifier=module.id,
            )
        )


def delete_module_issue_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
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
                actor=actor,
                verb="deleted",
                old_value=module.name if module is not None else "",
                new_value="",
                field="modules",
                project=project,
                workspace=project.workspace,
                comment=f"removed this issue from {module.name if module is not None else None}",
                old_identifier=module.id if module is not None else None,
            )
        )


def create_link_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project=project,
            workspace=project.workspace,
            comment=f"created a link",
            verb="created",
            actor=actor,
            field="link",
            new_value=requested_data.get("url", ""),
            new_identifier=requested_data.get("id", None),
        )
    )


def update_link_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("url") != requested_data.get("url"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                project=project,
                workspace=project.workspace,
                comment=f"updated a link",
                verb="updated",
                actor=actor,
                field="link",
                old_value=current_instance.get("url", ""),
                old_identifier=current_instance.get("id"),
                new_value=requested_data.get("url", ""),
                new_identifier=current_instance.get("id", None),
            )
        )


def delete_link_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):

    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project=project,
            workspace=project.workspace,
            comment=f"deleted the link",
            verb="deleted",
            actor=actor,
            field="link",
            old_value=current_instance.get("url", ""),
            new_value=""
        )
    )


def create_attachment_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project=project,
            workspace=project.workspace,
            comment=f"created an attachment",
            verb="created",
            actor=actor,
            field="attachment",
            new_value=current_instance.get("asset", ""),
            new_identifier=current_instance.get("id", None),
        )
    )


def delete_attachment_activity(
    requested_data, current_instance, issue_id, project, actor, issue_activities
):
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project=project,
            workspace=project.workspace,
            comment=f"deleted the attachment",
            verb="deleted",
            actor=actor,
            field="attachment",
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
    subscriber=True,
):
    try:
        issue_activities = []

        actor = User.objects.get(pk=actor_id)
        project = Project.objects.get(pk=project_id)

        if type not in [
            "cycle.activity.created",
            "cycle.activity.deleted",
            "module.activity.created",
            "module.activity.deleted",
        ]:
            issue = Issue.objects.filter(pk=issue_id).first()

            if issue is not None:
                try:
                    issue.updated_at = timezone.now()
                    issue.save(update_fields=["updated_at"])
                except Exception as e:
                    pass

            if subscriber:
                # add the user to issue subscriber
                try:
                    _ = IssueSubscriber.objects.get_or_create(
                        issue_id=issue_id, subscriber=actor
                    )
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
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                requested_data,
                current_instance,
                issue_id,
                project,
                actor,
                issue_activities,
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

        if type not in [
            "cycle.activity.created",
            "cycle.activity.deleted",
            "module.activity.created",
            "module.activity.deleted",
        ]:
            # Create Notifications
            bulk_notifications = []

            issue_subscribers = list(
                IssueSubscriber.objects.filter(project=project, issue_id=issue_id)
                .exclude(subscriber_id=actor_id)
                .values_list("subscriber", flat=True)
            )

            issue_assignees = list(
                IssueAssignee.objects.filter(project=project, issue_id=issue_id)
                .exclude(assignee_id=actor_id)
                .values_list("assignee", flat=True)
            )

            issue_subscribers = issue_subscribers + issue_assignees

            issue = Issue.objects.filter(pk=issue_id).first()

            # Add bot filtering
            if (
                issue is not None
                and issue.created_by_id is not None
                and not issue.created_by.is_bot
                and str(issue.created_by_id) != str(actor_id)
            ):
                issue_subscribers = issue_subscribers + [issue.created_by_id]

            for subscriber in issue_subscribers:
                for issue_activity in issue_activities_created:
                    bulk_notifications.append(
                        Notification(
                            workspace=project.workspace,
                            sender="in_app:issue_activities",
                            triggered_by_id=actor_id,
                            receiver_id=subscriber,
                            entity_identifier=issue_id,
                            entity_name="issue",
                            project=project,
                            title=issue_activity.comment,
                            data={
                                "issue": {
                                    "id": str(issue_id),
                                    "name": str(issue.name),
                                    "identifier": str(issue.project.identifier),
                                    "sequence_id": issue.sequence_id,
                                    "state_name": issue.state.name,
                                    "state_group": issue.state.group,
                                },
                                "issue_activity": {
                                    "id": str(issue_activity.id),
                                    "verb": str(issue_activity.verb),
                                    "field": str(issue_activity.field),
                                    "actor": str(issue_activity.actor_id),
                                    "new_value": str(issue_activity.new_value),
                                    "old_value": str(issue_activity.old_value),
                                    "issue_comment": str(
                                        issue_activity.issue_comment.comment_stripped
                                        if issue_activity.issue_comment is not None
                                        else ""
                                    ),
                                },
                            },
                        )
                    )

            # Bulk create notifications
            Notification.objects.bulk_create(bulk_notifications, batch_size=100)

        return
    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
