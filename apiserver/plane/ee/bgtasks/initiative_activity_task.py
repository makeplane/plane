# Python imports
import json


# Third Party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import CommentReaction, Label, Project, Workspace
from plane.ee.models import (
    Initiative,
    InitiativeActivity,
    InitiativeReaction,
    InitiativeComment,
    InitiativeCommentReaction,
)
from plane.db.models import Issue

from plane.settings.redis import redis_instance
from plane.utils.exception_logger import log_exception


# Track Changes in name
def track_name(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    if current_instance.get("name") != requested_data.get("name"):
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
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


# Track initiative description
def track_description(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    if current_instance.get("description_html") != requested_data.get(
        "description_html"
    ):
        last_activity = (
            InitiativeActivity.objects.filter(initiative_id=initiative_id)
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
            initiative_activities.append(
                InitiativeActivity(
                    initiative_id=initiative_id,
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


# Track changes in state of the initiative
def track_status(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    if current_instance.get("status") != requested_data.get("status"):
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("status"),
                new_value=requested_data.get("status"),
                field="status",
                workspace_id=workspace_id,
                comment="updated the state to",
                old_identifier=None,
                new_identifier=None,
                epoch=epoch,
            )
        )


# Track changes in initiative end date
def track_end_date(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    if current_instance.get("end_date") != requested_data.get("end_date"):
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
                actor_id=actor_id,
                verb="updated",
                old_value=(
                    current_instance.get("end_date")
                    if current_instance.get("end_date") is not None
                    else ""
                ),
                new_value=(
                    requested_data.get("end_date")
                    if requested_data.get("end_date") is not None
                    else ""
                ),
                field="end_date",
                workspace_id=workspace_id,
                comment="updated the end date to",
                epoch=epoch,
            )
        )


# Track changes in initiative start date
def track_start_date(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    if current_instance.get("start_date") != requested_data.get("start_date"):
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
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
                workspace_id=workspace_id,
                comment="updated the start date to ",
                epoch=epoch,
            )
        )


# Track changes in initiative labels
def track_labels(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    requested_labels = set([str(lab) for lab in requested_data.get("label_ids", [])])
    current_labels = set([str(lab) for lab in current_instance.get("label_ids", [])])

    added_labels = requested_labels - current_labels
    dropped_labels = current_labels - requested_labels

    # Set of newly added labels
    for added_label in added_labels:
        label = Label.objects.get(pk=added_label)
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
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
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
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


# Track changes in initiatives projects
def track_projects(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    requested_projects = (
        set([str(asg) for asg in requested_data.get("project_ids", [])])
        if requested_data is not None
        else set()
    )
    current_projects = (
        set([str(asg) for asg in current_instance.get("project_ids", [])])
        if current_instance is not None
        else set()
    )

    added_projects = requested_projects - current_projects
    dropped_projects = current_projects - requested_projects

    added_projects = Project.objects.filter(pk__in=added_projects).values("id", "name")
    dropped_projects = Project.objects.filter(pk__in=dropped_projects).values(
        "id", "name"
    )

    for added_project in added_projects:
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value="",
                new_value=added_project["name"],
                field="projects",
                comment="added project ",
                new_identifier=added_project["id"],
                epoch=epoch,
            )
        )

    for dropped_project in dropped_projects:
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value=dropped_project["name"],
                new_value="",
                field="projects",
                comment="removed project ",
                old_identifier=dropped_project["id"],
                epoch=epoch,
            )
        )


def track_epics(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    requested_epics = (
        set([str(asg) for asg in requested_data.get("epic_ids", [])])
        if requested_data is not None
        else set()
    )
    current_epics = (
        set([str(asg) for asg in current_instance.get("epic_ids", [])])
        if current_instance is not None
        else set()
    )

    added_epics = requested_epics - current_epics
    dropped_epics = current_epics - requested_epics

    added_epics = Issue.objects.filter(pk__in=added_epics).values("id", "name")
    dropped_epics = Issue.objects.filter(pk__in=dropped_epics).values("id", "name")

    for added_epic in added_epics:
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value="",
                new_value=added_epic["name"],
                field="epics",
                comment="added epic ",
                new_identifier=added_epic["id"],
                epoch=epoch,
            )
        )

    for dropped_epic in dropped_epics:
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value=dropped_epic["name"],
                new_value="",
                field="epics",
                comment="removed epic ",
                old_identifier=dropped_epic["id"],
                epoch=epoch,
            )
        )


def track_lead(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    if current_instance.get("lead") != requested_data.get("lead"):
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
                actor_id=actor_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value=None,
                new_value="",
                field="lead",
                comment="updated lead ",
                old_identifier=current_instance.get("lead"),
                new_identifier=requested_data.get("lead"),
                epoch=epoch,
            )
        )


def create_initiative_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    initiative = Initiative.objects.get(pk=initiative_id)
    initiative_activity = InitiativeActivity.objects.create(
        initiative_id=initiative_id,
        workspace_id=workspace_id,
        comment="created the initiative",
        field="initiative",
        verb="created",
        actor_id=actor_id,
        epoch=epoch,
    )
    initiative_activity.created_at = initiative.created_at
    initiative_activity.actor_id = initiative.created_by_id
    initiative_activity.save(update_fields=["created_at", "actor_id"])


def update_initiative_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    INITIATIVE_ACTIVITY_MAPPER = {
        "name": track_name,
        "status": track_status,
        "description_html": track_description,
        "end_date": track_end_date,
        "start_date": track_start_date,
        "lead": track_lead,
        "label_ids": track_labels,
        "project_ids": track_projects,
        "epic_ids": track_epics,
    }

    requested_data = json.loads(requested_data) if requested_data is not None else None

    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    for key in requested_data:
        func = INITIATIVE_ACTIVITY_MAPPER.get(key)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                initiative_id=initiative_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                initiative_activities=initiative_activities,
                epoch=epoch,
            )


def delete_initiative_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    initiative_activities.append(
        InitiativeActivity(
            workspace_id=workspace_id,
            initiative_id=initiative_id,
            comment="deleted the initiative",
            verb="deleted",
            actor_id=actor_id,
            field="initiative",
            epoch=epoch,
        )
    )


def create_comment_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    initiative_activities.append(
        InitiativeActivity(
            initiative_id=initiative_id,
            workspace_id=workspace_id,
            comment="created a comment",
            verb="created",
            actor_id=actor_id,
            field="comment",
            new_value=requested_data.get("comment_html", ""),
            new_identifier=requested_data.get("id", None),
            initiative_comment_id=requested_data.get("id", None),
            epoch=epoch,
        )
    )


def update_comment_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("comment_html") != requested_data.get("comment_html"):
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
                workspace_id=workspace_id,
                comment="updated a comment",
                verb="updated",
                actor_id=actor_id,
                field="comment",
                old_value=current_instance.get("comment_html", ""),
                old_identifier=current_instance.get("id"),
                new_value=requested_data.get("comment_html", ""),
                new_identifier=current_instance.get("id", None),
                initiative_comment_id=current_instance.get("id", None),
                epoch=epoch,
            )
        )


def delete_comment_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    initiative_activities.append(
        InitiativeActivity(
            initiative_id=initiative_id,
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
    initiative_id,
    actor_id,
    workspace_id,
    initiative_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    initiative_activities.append(
        InitiativeActivity(
            initiative_id=initiative_id,
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
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance.get("url") != requested_data.get("url"):
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
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
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    initiative_activities.append(
        InitiativeActivity(
            initiative_id=initiative_id,
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
    initiative_id,
    actor_id,
    workspace_id,
    initiative_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    initiative_activities.append(
        InitiativeActivity(
            initiative_id=initiative_id,
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
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    initiative_activities.append(
        InitiativeActivity(
            initiative_id=initiative_id,
            workspace_id=workspace_id,
            comment="deleted the attachment",
            verb="deleted",
            actor_id=actor_id,
            field="attachment",
            epoch=epoch,
        )
    )


def create_initiative_reaction_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    if requested_data and requested_data.get("reaction") is not None:
        initiative_reaction = (
            InitiativeReaction.objects.filter(
                reaction=requested_data.get("reaction"),
                actor_id=actor_id,
                initiative_id=initiative_id,
            )
            .values_list("id", flat=True)
            .first()
        )
        if initiative_reaction is not None:
            initiative_activities.append(
                InitiativeActivity(
                    initiative_id=initiative_id,
                    actor_id=actor_id,
                    verb="created",
                    old_value=None,
                    new_value=requested_data.get("reaction"),
                    field="reaction",
                    workspace_id=workspace_id,
                    comment="added the reaction",
                    old_identifier=None,
                    new_identifier=initiative_reaction,
                    epoch=epoch,
                )
            )


def delete_initiative_reaction_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    if current_instance and current_instance.get("reaction") is not None:
        initiative_activities.append(
            InitiativeActivity(
                initiative_id=initiative_id,
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


def create_comment_reaction_activity(
    requested_data,
    current_instance,
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    if requested_data and requested_data.get("reaction") is not None:
        comment_reaction_id, comment_id = (
            InitiativeCommentReaction.objects.filter(
                reaction=requested_data.get("reaction"),
                workspace_id=workspace_id,
                actor_id=actor_id,
            )
            .values_list("id", "comment__id")
            .first()
        )

        comment = InitiativeComment.objects.get(
            pk=comment_id, initiative_id=initiative_id
        )
        if (
            comment is not None
            and comment_reaction_id is not None
            and comment_id is not None
        ):
            initiative_activities.append(
                InitiativeActivity(
                    initiative_id=comment.initiative_id,
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
    initiative_id,
    workspace_id,
    actor_id,
    initiative_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    if current_instance and current_instance.get("reaction") is not None:
        initiative_id = (
            InitiativeComment.objects.filter(
                pk=current_instance.get("comment_id"), initiative_id=initiative_id
            )
            .values_list("initiative_id", flat=True)
            .first()
        )
        if initiative_id is not None:
            initiative_activities.append(
                InitiativeActivity(
                    initiative_id=initiative_id,
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


# Receive message from room group
@shared_task
def initiative_activity(
    type,
    requested_data,
    current_instance,
    initiative_id,
    actor_id,
    slug,
    epoch,
    subscriber=True,
    notification=False,
    origin=None,
    intake=None,
):
    try:
        initiative_activities = []

        workspace = Workspace.objects.get(slug=slug)
        workspace_id = workspace.id

        if initiative_id is not None:
            if origin:
                ri = redis_instance()
                # set the request origin in redis
                ri.set(str(initiative_id), origin, ex=600)
            initiative = Initiative.objects.filter(pk=initiative_id).first()
            if initiative:
                try:
                    initiative.updated_at = timezone.now()
                    initiative.save(update_fields=["updated_at"])
                except Exception:
                    pass

        ACTIVITY_MAPPER = {
            "initiative.activity.created": create_initiative_activity,
            "initiative.activity.updated": update_initiative_activity,
            "initiative.activity.deleted": delete_initiative_activity,
            "comment.activity.created": create_comment_activity,
            "comment.activity.updated": update_comment_activity,
            "comment.activity.deleted": delete_comment_activity,
            "link.activity.created": create_link_activity,
            "link.activity.updated": update_link_activity,
            "link.activity.deleted": delete_link_activity,
            "attachment.activity.created": create_attachment_activity,
            "attachment.activity.deleted": delete_attachment_activity,
            "initiative_reaction.activity.created": create_initiative_reaction_activity,
            "initiative_reaction.activity.deleted": delete_initiative_reaction_activity,
            "comment_reaction.activity.created": create_comment_reaction_activity,
            "comment_reaction.activity.deleted": delete_comment_reaction_activity,
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                initiative_id=initiative_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                initiative_activities=initiative_activities,
                epoch=epoch,
            )

        # Save all the values to database
        _ = InitiativeActivity.objects.bulk_create(initiative_activities)

        return
    except Exception as e:
        log_exception(e)
        return
