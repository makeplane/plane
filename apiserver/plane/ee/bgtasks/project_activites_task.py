# Python imports
import json


# Third Party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.ee.models import WorkspaceActivity, ProjectReaction, ProjectState
from plane.db.models import CommentReaction, IssueComment, Project, User, State, Label
from plane.utils.exception_logger import log_exception


# Track Changes in name
def track_name(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("name") != requested_data.get("name"):
        project_activities.append(
            WorkspaceActivity(
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


# Track project description
def track_description(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("description_html") != requested_data.get("description_html"):
        last_activity = (
            WorkspaceActivity.objects.filter(project_id=project_id)
            .order_by("-created_at")
            .first()
        )
        if (
            last_activity is not None
            and last_activity.field == "description_html"
            and actor_id == str(last_activity.actor_id)
        ):
            last_activity.created_at = timezone.now()
            last_activity.save(update_fields=["created_at"])
        else:
            project_activities.append(
                WorkspaceActivity(
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


# Track changes in priority
def track_priority(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("priority") != requested_data.get("priority"):
        project_activities.append(
            WorkspaceActivity(
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


# Track changes in state of the project
def track_state(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("state_id") != requested_data.get("state_id"):
        new_state = ProjectState.objects.get(pk=requested_data.get("state_id", None))
        old_state = ProjectState.objects.get(
            pk=current_instance.get("state_id", None)
        )

        project_activities.append(
            WorkspaceActivity(
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


# Track changes in project target date
def track_target_date(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("target_date") != requested_data.get("target_date"):
        project_activities.append(
            WorkspaceActivity(
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


# Track changes in project start date
def track_start_date(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("start_date") != requested_data.get("start_date"):
        project_activities.append(
            WorkspaceActivity(
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


def track_boolean_field(
    field_name,
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    """
    Generic function to track changes in boolean fields and log project activity.
    """
    old_value = current_instance.get(field_name)
    new_value = requested_data.get(field_name)

    if old_value != new_value:
        status = "enabled" if new_value else "disabled"
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb=status,
                old_value=old_value,
                new_value=new_value,
                field=field_name,
                project_id=project_id,
                workspace_id=workspace_id,
                comment=f"{status} {field_name}",
                epoch=epoch,
            )
        )


def track_network(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("network") != requested_data.get("network"):
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("network"),
                new_value=requested_data.get("network"),
                field="network",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the network to",
                epoch=epoch,
            )
        )


def track_archived_at(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("archived_at") != requested_data.get("archived_at"):
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb="archived" if requested_data.get("archived_at") else "restored",
                old_value=current_instance.get("archived_at"),
                new_value=requested_data.get("archived_at"),
                field="archived_at",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the archived_at to",
                epoch=epoch,
            )
        )


def track_identifier(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("identifier") != requested_data.get("identifier"):
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("identifier"),
                new_value=requested_data.get("identifier"),
                field="identifier",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the identifier to",
                epoch=epoch,
            )
        )


def track_timezone(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("timezone") != requested_data.get("timezone"):
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("timezone"),
                new_value=requested_data.get("timezone"),
                field="timezone",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the timezone to",
                epoch=epoch,
            )
        )


def track_lead(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("project_lead") != requested_data.get("project_lead"):
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value=None,
                new_value="",
                field="lead",
                comment="updated lead ",
                project_id=project_id,
                old_identifier=current_instance.get("project_lead"),
                new_identifier=requested_data.get("project_lead"),
                epoch=epoch,
            )
        )


def track_deploy_board(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if current_instance.get("deploy_board") != requested_data.get("deploy_board"):
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="published"
                if requested_data.get("deploy_board")
                else "unpublished",
                old_value=current_instance.get("deploy_board"),
                new_value=requested_data.get("deploy_board"),
                field="deploy_board",
                comment="updated deploy board ",
                project_id=project_id,
                old_identifier=current_instance.get("deploy_board"),
            )
        )


def track_members(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if requested_data:
        members = requested_data.get("members", [])
        for member in members:
            member = User.objects.get(id=member.get("member_id"))
            project_activities.append(
                WorkspaceActivity(
                    actor_id=actor_id,
                    verb="joined" if requested_data.get("joined", None) else "added",
                    old_value=None,
                    new_value=member.first_name + " " + member.last_name,
                    field="members",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    old_identifier=None,
                    new_identifier=member.id,
                    comment="joined the project" if requested_data.get("joined", None) else "added the member",
                    epoch=epoch,
                )
            )

    if current_instance:
        members = current_instance.get("members", [])
        for member in members:
            member = User.objects.get(id=member)
            project_activities.append(
                WorkspaceActivity(
                    actor_id=actor_id,
                    verb="removed" if current_instance.get("removed") else "left",
                    old_value=member.first_name + " " + member.last_name,
                    new_value=None,
                    field="members",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    old_identifier=member.id,
                    new_identifier=None,
                    comment="removed the members"
                    if current_instance.get("removed")
                    else "left the project",
                    epoch=epoch,
                )
            )


def track_project_state(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):  

    if requested_data.get("project_state"):
        new_state = State.objects.get(id=requested_data.get("project_state"))
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb="created",
                old_value="",
                new_value=new_state.name,
                field="project_state",
                project_id=project_id,
                workspace_id=workspace_id,
                old_identifier=None,
                new_identifier=new_state.id,
                comment="created a new state",
                epoch=epoch,
            )
        )
    
    if current_instance.get("project_state"):
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb="deleted",
                old_value=current_instance.get("state_name"),
                new_value="",
                field="project_state",
                project_id=project_id,
                workspace_id=workspace_id,
                old_identifier=current_instance.get("project_state"),
                new_identifier=None,
                comment="removed the project state",
                epoch=epoch,
            )
        )

def track_label(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    if requested_data.get("label"):
        new_label = Label.objects.get(id=requested_data.get("label"))
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb="created",
                old_value="",
                new_value=new_label.name,
                field="label",
                project_id=project_id,
                workspace_id=workspace_id,
                old_identifier=None,
                new_identifier=new_label.id,
                comment="created a new label",
                epoch=epoch,
            )
        )
    
    if current_instance.get("label"):
        project_activities.append(
            WorkspaceActivity(
                actor_id=actor_id,
                verb="deleted",
                old_value=current_instance.get("label_name"),
                new_value="",
                field="label",
                project_id=project_id,
                workspace_id=workspace_id,
                old_identifier=current_instance.get("label"),
                new_identifier=None,
                comment="removed the project label",
                epoch=epoch,
            )
        )


def create_project_activity(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    project_activity = WorkspaceActivity.objects.create(
        project_id=project_id,
        workspace_id=workspace_id,
        comment="created the project",
        verb="created",
        field="project",
        actor_id=actor_id,
        epoch=epoch,
    )
    project_activity.save(update_fields=["created_at", "actor_id"])


def update_project_activity(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    project_activity_MAPPER = {
        "name": track_name,
        "description_html": track_description,
        "target_date": track_target_date,
        "start_date": track_start_date,
        "priority": track_priority,
        "state_id": track_state,
        "network": track_network,
        "identifier": track_identifier,
        "timezone": track_timezone,
        "archived_at": track_archived_at,
        "project_lead": track_lead,
        "deploy_board": track_deploy_board,
        "members": track_members,
        "project_state": track_project_state,
        "label": track_label,
    }

    boolean_fields = [
        "is_project_updates_enabled",
        "is_epic_enabled",
        "is_workflow_enabled",
        "module_view",
        "cycle_view",
        "issue_views_view",
        "page_view",
        "intake_view",
        "is_time_tracking_enabled",
        "is_issue_type_enabled",
        "estimate"
    ]

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    for key in requested_data:
        func = project_activity_MAPPER.get(key)
        if key in boolean_fields:
            # Handle boolean fields
            track_boolean_field(
                key,
                requested_data,
                current_instance,
                project_id,
                workspace_id,
                actor_id,
                project_activities,
                epoch,
            )
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                project_activities=project_activities,
                epoch=epoch,
            )


def delete_project_activity(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    project_activities.append(
        WorkspaceActivity(
            project_id=project_id,
            workspace_id=workspace_id,
            comment="deleted the project",
            verb="deleted",
            actor_id=actor_id,
            field="project",
            epoch=epoch,
        )
    )


def create_comment_activity(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    project_activities.append(
        WorkspaceActivity(
            project_id=project_id,
            workspace_id=workspace_id,
            comment="created a comment",
            verb="created",
            actor_id=actor_id,
            field="comment",
            new_value=requested_data.get("comment_html", ""),
            new_identifier=requested_data.get("id", None),
            epoch=epoch,
        )
    )


def update_comment_activity(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("comment_html") != requested_data.get("comment_html"):
        project_activities.append(
            WorkspaceActivity(
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
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    project_activities.append(
        WorkspaceActivity(
            project_id=project_id,
            workspace_id=workspace_id,
            comment="deleted the comment",
            verb="deleted",
            actor_id=actor_id,
            field="comment",
            epoch=epoch,
        )
    )


def create_link_activity(
    requested_data,
    current_instance,
    project_id,
    actor_id,
    workspace_id,
    project_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    project_activities.append(
        WorkspaceActivity(
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
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("url") != requested_data.get("url"):
        project_activities.append(
            WorkspaceActivity(
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
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    project_activities.append(
        WorkspaceActivity(
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
    project_id,
    actor_id,
    workspace_id,
    project_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    project_activities.append(
        WorkspaceActivity(
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
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    project_activities.append(
        WorkspaceActivity(
            project_id=project_id,
            workspace_id=workspace_id,
            comment="deleted the attachment",
            verb="deleted",
            actor_id=actor_id,
            field="attachment",
            epoch=epoch,
        )
    )


def create_project_reaction_activity(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    if requested_data and requested_data.get("reaction") is not None:
        project_reaction = (
            ProjectReaction.objects.filter(
                reaction=requested_data.get("reaction"),
                project_id=project_id,
                actor_id=actor_id,
            )
            .values_list("id", flat=True)
            .first()
        )
        if project_reaction is not None:
            project_activities.append(
                WorkspaceActivity(
                    actor_id=actor_id,
                    verb="created",
                    old_value=None,
                    new_value=requested_data.get("reaction"),
                    field="reaction",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="added the reaction",
                    old_identifier=None,
                    new_identifier=project_reaction,
                    epoch=epoch,
                )
            )


def delete_project_reaction_activity(
    requested_data,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    project_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance and current_instance.get("reaction") is not None:
        project_activities.append(
            WorkspaceActivity(
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
    project_id,
    workspace_id,
    actor_id,
    project_activities,
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
            project_activities.append(
                WorkspaceActivity(
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


# def delete_comment_reaction_activity(
#     requested_data,
#     current_instance,
#     issue_id,
#     project_id,
#     workspace_id,
#     actor_id,
#     project_activities,
#     epoch,
# ):
#     current_instance = (
#         json.loads(current_instance) if current_instance is not None else None
#     )
#     if current_instance and current_instance.get("reaction") is not None:
#         issue_id = (
#             ProjectComment.objects.filter(
#                 pk=current_instance.get("comment_id"), project_id=project_id
#             )
#             .values_list("issue_id", flat=True)
#             .first()
#         )
#         if issue_id is not None:
#             project_activities.append(
#                 WorkspaceActivity(
#                     actor_id=actor_id,
#                     verb="deleted",
#                     old_value=current_instance.get("reaction"),
#                     new_value=None,
#                     field="reaction",
#                     project_id=project_id,
#                     workspace_id=workspace_id,
#                     comment="removed the reaction",
#                     old_identifier=current_instance.get("identifier"),
#                     new_identifier=None,
#                     epoch=epoch,
#                 )
#             )


# Receive message from room group
@shared_task
def project_activity(
    type,
    requested_data,
    current_instance,
    actor_id,
    project_id,
    epoch,
    subscriber=True,
    notification=False,
    origin=None,
    inbox=None,
):
    try:
        project_activities = []

        project = Project.objects.get(pk=project_id)
        workspace_id = project.workspace_id

        ACTIVITY_MAPPER = {
            "project.activity.created": create_project_activity,
            "project.activity.updated": update_project_activity,
            "project.activity.deleted": delete_project_activity,
            "comment.activity.created": create_comment_activity,
            "comment.activity.updated": update_comment_activity,
            "comment.activity.deleted": delete_comment_activity,
            "link.activity.created": create_link_activity,
            "link.activity.updated": update_link_activity,
            "link.activity.deleted": delete_link_activity,
            "attachment.activity.created": create_attachment_activity,
            "attachment.activity.deleted": delete_attachment_activity,
            "project_reaction.activity.created": create_project_reaction_activity,
            "project_reaction.activity.deleted": delete_project_reaction_activity,
            "comment_reaction.activity.created": create_comment_reaction_activity,
            # "comment_reaction.activity.deleted": delete_comment_reaction_activity,
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                project_activities=project_activities,
                epoch=epoch,
            )

        # Save all the values to database
        WorkspaceActivity.objects.bulk_create(project_activities)

        return
    except Exception as e:
        log_exception(e)
        return
