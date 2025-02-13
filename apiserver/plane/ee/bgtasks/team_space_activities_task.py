# Python imports
import json

# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.ee.models import (
    TeamspaceActivity,
    Teamspace,
    TeamspaceComment,
    TeamspaceCommentReaction,
)
from plane.db.models import Label, Project, User, Workspace
from plane.utils.exception_logger import log_exception


# Track Changes in name
def track_name(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    if current_instance.get("name") != requested_data.get("name"):
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("name"),
                new_value=requested_data.get("name"),
                field="name",
                workspace_id=workspace_id,
                comment="updated the name to",
                epoch=epoch,
            )
        )


# Track team space description
def track_description(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    if current_instance.get("description_html") != requested_data.get(
        "description_html"
    ):
        last_activity = (
            TeamspaceActivity.objects.filter(team_space_id=team_space_id)
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
            team_space_activities.append(
                TeamspaceActivity(
                    team_space_id=team_space_id,
                    actor_id=actor_id,
                    verb="updated",
                    old_value=current_instance.get("description_html"),
                    new_value=requested_data.get("description_html"),
                    field="description",
                    workspace_id=workspace_id,
                    comment="updated the description to",
                    epoch=epoch,
                )
            )


def track_lead(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    if current_instance.get("lead_id") != requested_data.get("lead_id"):
        # Get the current user
        current_user = (
            User.objects.get(pk=current_instance.get("lead_id"))
            if current_instance.get("lead_id")
            else None
        )

        # Get the requested user
        requested_user = (
            User.objects.get(pk=requested_data.get("lead_id"))
            if requested_data.get("lead_id")
            else None
        )

        # create team activity
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_user.display_name if current_user else "",
                new_value=requested_user.display_name if requested_user else "",
                old_identifier=current_instance.get("lead_id"),
                new_identifier=requested_data.get("lead_id"),
                field="lead",
                workspace_id=workspace_id,
                comment="updated the team lead to",
                epoch=epoch,
            )
        )


# Track changes in teamspace labels
def track_labels(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    requested_labels = set([str(lab) for lab in requested_data.get("label_ids", [])])
    current_labels = set([str(lab) for lab in current_instance.get("label_ids", [])])

    added_labels = requested_labels - current_labels
    dropped_labels = current_labels - requested_labels

    # Set of newly added labels
    for added_label in added_labels:
        label = Label.objects.get(pk=added_label)
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                actor_id=actor_id,
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
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value=label.name,
                new_value="",
                field="labels",
                comment="removed label ",
                old_identifier=label.id,
                new_identifier=None,
                epoch=epoch,
            )
        )


# Track changes in team space projects
def track_projects(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    requested_projects = (
        set([str(proj) for proj in requested_data.get("project_ids", [])])
        if requested_data is not None
        else set()
    )
    current_projects = (
        set([str(proj) for proj in current_instance.get("project_ids", [])])
        if current_instance is not None
        else set()
    )

    added_projects = requested_projects - current_projects
    dropped_projects = current_projects - requested_projects

    for added_project in added_projects:
        project = Project.objects.get(pk=added_project)
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value="",
                new_value=project.name,
                field="projects",
                comment="added project ",
                new_identifier=project.id,
                epoch=epoch,
            )
        )

    for dropped_project in dropped_projects:
        project = Project.objects.get(pk=dropped_project)
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value=project.name,
                new_value="",
                field="projects",
                comment="removed project ",
                old_identifier=project.id,
                epoch=epoch,
            )
        )


def track_team_members(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    # Set of newly added members and dropped members
    current_members = set(current_instance.get("member_ids", []))
    requested_members = set(requested_data.get("member_ids", []))

    # Set of newly added members
    added_members = set(requested_members) - set(current_members)

    # Set of dropped members
    dropped_members = set(current_members) - set(requested_members)

    # Create team space activities for added members
    for added_member in added_members:
        member = User.objects.get(pk=added_member)
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value="",
                new_value=member.display_name,
                field="members",
                comment="added member ",
                new_identifier=member.id,
                epoch=epoch,
            )
        )

    # Create team space activities for dropped members
    for dropped_member in dropped_members:
        member = User.objects.get(pk=dropped_member)
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value=member.display_name,
                new_value="",
                field="members",
                comment="removed member ",
                old_identifier=member.id,
                epoch=epoch,
            )
        )


def create_team_space_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    team_space = Teamspace.objects.get(pk=team_space_id)
    team_space_activity = TeamspaceActivity.objects.create(
        team_space_id=team_space_id,
        workspace_id=workspace_id,
        comment="created the team_space",
        verb="created",
        actor_id=actor_id,
        field="team_space",
        epoch=epoch,
    )
    team_space_activity.actor_id = team_space.created_by_id
    team_space_activity.save(update_fields=["created_at", "actor_id"])


def update_team_space_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    TEAM_SPACE_ACTIVITY_MAPPER = {
        "name": track_name,
        "description_html": track_description,
        "lead_id": track_lead,
        "label_ids": track_labels,
        "project_ids": track_projects,
        "member_ids": track_team_members,
    }

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    for key in requested_data:
        func = TEAM_SPACE_ACTIVITY_MAPPER.get(key)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                team_space_id=team_space_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                team_space_activities=team_space_activities,
                epoch=epoch,
            )


def delete_team_space_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    team_space_activities.append(
        TeamspaceActivity(
            workspace_id=workspace_id,
            team_space_id=team_space_id,
            comment="deleted the team_space",
            verb="deleted",
            actor_id=actor_id,
            field="team_space",
            epoch=epoch,
        )
    )


def create_comment_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    team_space_activities.append(
        TeamspaceActivity(
            team_space_id=team_space_id,
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
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("comment_html") != requested_data.get("comment_html"):
        team_space_activities.append(
            TeamspaceActivity(
                team_space_id=team_space_id,
                workspace_id=workspace_id,
                comment="updated a comment",
                verb="updated",
                actor_id=actor_id,
                field="comment",
                old_value=current_instance.get("comment_html", ""),
                old_identifier=current_instance.get("id"),
                new_value=requested_data.get("comment_html", ""),
                new_identifier=current_instance.get("id", None),
                epoch=epoch,
            )
        )


def delete_comment_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    team_space_activities.append(
        TeamspaceActivity(
            team_space_id=team_space_id,
            workspace_id=workspace_id,
            comment="deleted the comment",
            verb="deleted",
            actor_id=actor_id,
            field="comment",
            epoch=epoch,
        )
    )


def create_comment_reaction_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    if requested_data and requested_data.get("reaction") is not None:
        comment_reaction_id, comment_id = (
            TeamspaceCommentReaction.objects.filter(
                reaction=requested_data.get("reaction"),
                team_space_id=team_space_id,
                actor_id=actor_id,
            )
            .values_list("id", "comment__id")
            .first()
        )
        comment = TeamspaceComment.objects.get(
            pk=comment_id, team_space_id=team_space_id
        )
        if (
            comment is not None
            and comment_reaction_id is not None
            and comment_id is not None
        ):
            team_space_activities.append(
                TeamspaceActivity(
                    team_space_id=comment.team_space_id,
                    actor_id=actor_id,
                    verb="created",
                    old_value=None,
                    new_value=requested_data.get("reaction"),
                    field="reaction",
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
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance and current_instance.get("reaction") is not None:
        team_space_id = (
            TeamspaceComment.objects.filter(
                pk=current_instance.get("comment_id"), team_space_id=team_space_id
            )
            .values_list("team_space_id", flat=True)
            .first()
        )
        if team_space_id is not None:
            team_space_activities.append(
                TeamspaceActivity(
                    team_space_id=team_space_id,
                    actor_id=actor_id,
                    verb="deleted",
                    old_value=current_instance.get("reaction"),
                    new_value=None,
                    field="reaction",
                    workspace_id=workspace_id,
                    comment="removed the reaction",
                    old_identifier=current_instance.get("identifier"),
                    new_identifier=None,
                    epoch=epoch,
                )
            )


def create_page_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    team_space_activities.append(
        TeamspaceActivity(
            team_space_id=team_space_id,
            workspace_id=workspace_id,
            comment="created a page",
            verb="created",
            actor_id=actor_id,
            field="page",
            epoch=epoch,
            new_value=requested_data.get("name"),
            new_identifier=requested_data.get("id"),
        )
    )


def delete_page_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    team_space_activities.append(
        TeamspaceActivity(
            team_space_id=team_space_id,
            workspace_id=workspace_id,
            comment="deleted the page",
            verb="deleted",
            actor_id=actor_id,
            field="page",
            epoch=epoch,
            old_value=current_instance.get("name"),
            old_identifier=current_instance.get("id"),
        )
    )


def create_view_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None

    team_space_activities.append(
        TeamspaceActivity(
            team_space_id=team_space_id,
            workspace_id=workspace_id,
            comment="created a view",
            verb="created",
            actor_id=actor_id,
            field="view",
            epoch=epoch,
            new_value=requested_data.get("name"),
            new_identifier=requested_data.get("id"),
        )
    )


def delete_view_activity(
    requested_data,
    current_instance,
    team_space_id,
    workspace_id,
    actor_id,
    team_space_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    team_space_activities.append(
        TeamspaceActivity(
            team_space_id=team_space_id,
            workspace_id=workspace_id,
            comment="deleted the view",
            verb="deleted",
            actor_id=actor_id,
            field="view",
            epoch=epoch,
            old_value=current_instance.get("name"),
            old_identifier=current_instance.get("id"),
        )
    )


@shared_task
def team_space_activity(
    type, requested_data, team_space_id, actor_id, slug, current_instance, epoch
):
    try:
        # Get workspace
        workspace = Workspace.objects.get(slug=slug)
        workspace_id = workspace.id
        # Get team space
        team_space = Teamspace.objects.filter(
            workspace_id=workspace_id, pk=team_space_id
        ).first()
        if team_space is None:
            return
        # Update team space timestamp
        team_space.updated_at = timezone.now()
        team_space.save(update_fields=["updated_at"])

        team_space_activities = []

        ACTIVITY_MAPPER = {
            "team_space.activity.created": create_team_space_activity,
            "team_space.activity.updated": update_team_space_activity,
            "team_space.activity.deleted": delete_team_space_activity,
            "comment.activity.created": create_comment_activity,
            "comment.activity.updated": update_comment_activity,
            "comment.activity.deleted": delete_comment_activity,
            "comment_reaction.activity.created": create_comment_reaction_activity,
            "comment_reaction.activity.deleted": delete_comment_reaction_activity,
            "page.activity.created": create_page_activity,
            "page.activity.deleted": delete_page_activity,
            "view.activity.created": create_view_activity,
            "view.activity.deleted": delete_view_activity,
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                team_space_id=team_space_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                team_space_activities=team_space_activities,
                epoch=epoch,
            )

        # Save all the values to database
        _ = TeamspaceActivity.objects.bulk_create(
            team_space_activities, batch_size=100, ignore_conflicts=True
        )
        return

    except Exception as e:
        log_exception(e)
        return
