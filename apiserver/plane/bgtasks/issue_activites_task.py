# Python imports
import json

# Third Party imports
from django_rq import job
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import User, Issue, Project, Label, IssueActivity, State


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
                comment=f"{actor.email} updated the start date to {requested_data.get('name')}",
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
                    old_value=f"{project.identifier}-{old_parent.sequence_id}",
                    new_value=None,
                    field="parent",
                    project=project,
                    workspace=project.workspace,
                    comment=f"{actor.email} updated the parent issue to None",
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
                    old_value=f"{project.identifier}-{old_parent.sequence_id}"
                    if old_parent is not None
                    else None,
                    new_value=f"{project.identifier}-{new_parent.sequence_id}",
                    field="parent",
                    project=project,
                    workspace=project.workspace,
                    comment=f"{actor.email} updated the parent issue to {new_parent.name}",
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
                    comment=f"{actor.email} updated the priority to None",
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
                    comment=f"{actor.email} updated the priority to {requested_data.get('priority')}",
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
                comment=f"{actor.email} updated the state to {new_state.name}",
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
                comment=f"{actor.email} updated the description to {requested_data.get('description_html')}",
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
                    comment=f"{actor.email} updated the target date to None",
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
                    comment=f"{actor.email} updated the target date to {requested_data.get('target_date')}",
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
                    comment=f"{actor.email} updated the start date to None",
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
                    comment=f"{actor.email} updated the start date to {requested_data.get('start_date')}",
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
                        comment=f"{actor.email} added label {label.name}",
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
                        comment=f"{actor.email} removed label {label.name}",
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
                        new_value=assignee.email,
                        field="assignees",
                        project=project,
                        workspace=project.workspace,
                        comment=f"{actor.email} added assignee {assignee.email}",
                        new_identifier=actor.id,
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
                        old_value=assignee.email,
                        new_value="",
                        field="assignee",
                        project=project,
                        workspace=project.workspace,
                        comment=f"{actor.email} removed assignee {assignee.email}",
                        old_identifier=actor.id,
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
                        new_value=f"{project.identifier}-{issue.sequence_id}",
                        field="blocks",
                        project=project,
                        workspace=project.workspace,
                        comment=f"{actor.email} added blocking issue {project.identifier}-{issue.sequence_id}",
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
                        old_value=f"{project.identifier}-{issue.sequence_id}",
                        new_value="",
                        field="blocks",
                        project=project,
                        workspace=project.workspace,
                        comment=f"{actor.email} removed blocking issue {project.identifier}-{issue.sequence_id}",
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
                        new_value=f"{project.identifier}-{issue.sequence_id}",
                        field="blocking",
                        project=project,
                        workspace=project.workspace,
                        comment=f"{actor.email} added blocked by issue {project.identifier}-{issue.sequence_id}",
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
                        old_value=f"{project.identifier}-{issue.sequence_id}",
                        new_value="",
                        field="blocking",
                        project=project,
                        workspace=project.workspace,
                        comment=f"{actor.email} removed blocked by issue {project.identifier}-{issue.sequence_id}",
                        old_identifier=issue.id,
                    )
                )


# Receive message from room group
@job("default")
def issue_activity(event):
    try:
        issue_activities = []

        requested_data = json.loads(event.get("requested_data"))
        current_instance = json.loads(event.get("current_instance"))
        issue_id = event.get("issue_id")
        actor_id = event.get("actor_id")
        project_id = event.get("project_id")

        actor = User.objects.get(pk=actor_id)

        project = Project.objects.get(pk=project_id)

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
        }

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

        # Save all the values to database
        _ = IssueActivity.objects.bulk_create(issue_activities)

        return
    except Exception as e:
        capture_exception(e)
        return
