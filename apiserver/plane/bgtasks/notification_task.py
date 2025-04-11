# Python imports
import json
import uuid
from uuid import UUID


# Module imports
from plane.db.models import (
    IssueMention,
    IssueSubscriber,
    Project,
    User,
    IssueAssignee,
    Issue,
    EmailNotificationLog,
    Notification,
    IssueComment,
    IssueActivity,
    ProjectMember,
    NotificationTransportChoices,
    WorkspaceUserNotificationPreference,
)
from django.db.models import Subquery

# Third Party imports
from celery import shared_task
from bs4 import BeautifulSoup


# =========== Issue Description Html Parsing and notification Functions ======================


def update_mentions_for_issue(issue, project, new_mentions, removed_mention):
    aggregated_issue_mentions = []
    for mention_id in new_mentions:
        aggregated_issue_mentions.append(
            IssueMention(
                mention_id=mention_id,
                issue=issue,
                project=project,
                workspace_id=project.workspace_id,
            )
        )

    IssueMention.objects.bulk_create(aggregated_issue_mentions, batch_size=100)
    IssueMention.objects.filter(issue=issue, mention__in=removed_mention).delete()


def get_new_mentions(requested_instance, current_instance):
    # requested_data is the newer instance of the current issue
    # current_instance is the older instance of the current issue, saved in the database

    # extract mentions from both the instance of data
    mentions_older = extract_mentions(current_instance)

    mentions_newer = extract_mentions(requested_instance)

    # Getting Set Difference from mentions_newer
    new_mentions = [
        mention for mention in mentions_newer if mention not in mentions_older
    ]

    return new_mentions


# Get Removed Mention
def get_removed_mentions(requested_instance, current_instance):
    # requested_data is the newer instance of the current issue
    # current_instance is the older instance of the current issue, saved in the database

    # extract mentions from both the instance of data
    mentions_older = extract_mentions(current_instance)
    mentions_newer = extract_mentions(requested_instance)

    # Getting Set Difference from mentions_newer
    removed_mentions = [
        mention for mention in mentions_older if mention not in mentions_newer
    ]

    return removed_mentions


# Adds mentions as subscribers
def extract_mentions_as_subscribers(project_id, issue_id, mentions):
    # mentions is an array of User IDs representing the FILTERED set of mentioned users

    bulk_mention_subscribers = []

    for mention_id in mentions:
        # If the particular mention has not already been subscribed to the issue, he must be sent the mentioned notification
        if (
            not IssueSubscriber.objects.filter(
                issue_id=issue_id, subscriber_id=mention_id, project_id=project_id
            ).exists()
            and not IssueAssignee.objects.filter(
                project_id=project_id, issue_id=issue_id, assignee_id=mention_id
            ).exists()
            and not Issue.objects.filter(
                project_id=project_id, pk=issue_id, created_by_id=mention_id
            ).exists()
            and ProjectMember.objects.filter(
                project_id=project_id, member_id=mention_id, is_active=True
            ).exists()
        ):
            project = Project.objects.get(pk=project_id)

            bulk_mention_subscribers.append(
                IssueSubscriber(
                    workspace_id=project.workspace_id,
                    project_id=project_id,
                    issue_id=issue_id,
                    subscriber_id=mention_id,
                )
            )
    return bulk_mention_subscribers


# Parse Issue Description & extracts mentions
def extract_mentions(issue_instance):
    try:
        # issue_instance has to be a dictionary passed, containing the description_html and other set of activity data.
        mentions = []
        # Convert string to dictionary
        data = json.loads(issue_instance)
        html = data.get("description_html")
        soup = BeautifulSoup(html, "html.parser")
        mention_tags = soup.find_all(
            "mention-component", attrs={"entity_name": "user_mention"}
        )

        mentions = [mention_tag["entity_identifier"] for mention_tag in mention_tags]

        return list(set(mentions))
    except Exception:
        return []


# =========== Comment Parsing and notification Functions ======================
def extract_comment_mentions(comment_value):
    try:
        mentions = []
        soup = BeautifulSoup(comment_value, "html.parser")
        mentions_tags = soup.find_all(
            "mention-component", attrs={"entity_name": "user_mention"}
        )
        for mention_tag in mentions_tags:
            mentions.append(mention_tag["entity_identifier"])
        return list(set(mentions))
    except Exception:
        return []


def get_new_comment_mentions(new_value, old_value):
    mentions_newer = extract_comment_mentions(new_value)
    if old_value is None:
        return mentions_newer

    mentions_older = extract_comment_mentions(old_value)
    # Getting Set Difference from mentions_newer
    new_mentions = [
        mention for mention in mentions_newer if mention not in mentions_older
    ]

    return new_mentions


def create_mention_notification(
    project, notification_comment, issue, actor_id, mention_id, issue_id, activity
):
    return Notification(
        workspace=project.workspace,
        sender="in_app:issue_activities:mentioned",
        triggered_by_id=actor_id,
        receiver_id=mention_id,
        entity_identifier=issue_id,
        entity_name="issue",
        project=project,
        message=notification_comment,
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
                "id": str(activity.get("id")),
                "verb": str(activity.get("verb")),
                "field": str(activity.get("field")),
                "actor": str(activity.get("actor_id")),
                "new_value": str(activity.get("new_value")),
                "old_value": str(activity.get("old_value")),
                "old_identifier": (
                    str(activity.get("old_identifier"))
                    if activity.get("old_identifier")
                    else None
                ),
                "new_identifier": (
                    str(activity.get("new_identifier"))
                    if activity.get("new_identifier")
                    else None
                ),
            },
        },
    )


def process_mentions(
    requested_data,
    current_instance,
    project_id,
    issue_id,
    project_members,
    issue_activities_created,
):
    """
    Process mentions from issue data and comments.
    Returns new mentions, removed mentions, and subscribers.
    """
    # Get new mentions from the newer instance
    new_mentions = get_new_mentions(
        requested_instance=requested_data, current_instance=current_instance
    )
    new_mentions = list(set(new_mentions) & {str(member) for member in project_members})
    removed_mention = get_removed_mentions(
        requested_instance=requested_data, current_instance=current_instance
    )

    comment_mentions = []
    all_comment_mentions = []

    # Get New Subscribers from the mentions of the newer instance
    requested_mentions = extract_mentions(issue_instance=requested_data)
    mention_subscribers = extract_mentions_as_subscribers(
        project_id=project_id, issue_id=issue_id, mentions=requested_mentions
    )

    # Process comment mentions
    for issue_activity in issue_activities_created:
        issue_comment = issue_activity.get("issue_comment")
        issue_comment_new_value = issue_activity.get("new_value")
        issue_comment_old_value = issue_activity.get("old_value")
        if issue_comment is not None:
            all_comment_mentions = all_comment_mentions + extract_comment_mentions(
                issue_comment_new_value
            )

            new_comment_mentions = get_new_comment_mentions(
                old_value=issue_comment_old_value, new_value=issue_comment_new_value
            )
            comment_mentions = comment_mentions + new_comment_mentions
            comment_mentions = [
                mention
                for mention in comment_mentions
                if UUID(mention) in set(project_members)
            ]

    comment_mention_subscribers = extract_mentions_as_subscribers(
        project_id=project_id, issue_id=issue_id, mentions=all_comment_mentions
    )

    return {
        "new_mentions": new_mentions,
        "removed_mention": removed_mention,
        "comment_mentions": comment_mentions,
        "mention_subscribers": mention_subscribers,
        "comment_mention_subscribers": comment_mention_subscribers,
    }


def create_in_app_notifications(
    issue,
    project,
    actor_id,
    issue_activities_created,
    issue_subscribers,
    issue_assignees,
    new_mentions,
    comment_mentions,
    last_activity,
    issue_workspace_id,
):
    """
    Create in-app notifications for issue activities and mentions.
    Returns a list of Notification objects to be bulk created.
    """
    bulk_notifications = []

    # Process notifications for subscribers
    for subscriber in issue_subscribers:
        if issue.created_by_id and issue.created_by_id == subscriber:
            sender = "in_app:issue_activities:created"
        elif (
            subscriber in issue_assignees and issue.created_by_id not in issue_assignees
        ):
            sender = "in_app:issue_activities:assigned"
        else:
            sender = "in_app:issue_activities:subscribed"

        # Get user notification preferences for in-app
        in_app_preference = WorkspaceUserNotificationPreference.objects.filter(
            user_id=subscriber,
            workspace_id=issue_workspace_id,
            transport=NotificationTransportChoices.IN_APP[0],
        ).first()

        for issue_activity in issue_activities_created:
            # Skip if activity is not for this issue
            if issue_activity.get("issue_detail").get("id") != issue.id:
                continue

            # Skip description updates
            if issue_activity.get("field") == "description":
                continue

            # Check if notification should be sent based on preferences
            send_in_app = should_send_notification(
                in_app_preference, issue_activity.get("field")
            )

            if not send_in_app:
                continue

            # Get issue comment if relevant
            issue_comment = get_issue_comment_for_activity(
                issue_activity, issue.id, project.id, project.workspace_id
            )

            # Create in-app notification
            bulk_notifications.append(
                create_activity_notification(
                    project=project,
                    issue=issue,
                    sender=sender,
                    actor_id=actor_id,
                    subscriber=subscriber,
                    issue_activity=issue_activity,
                    issue_comment=issue_comment,
                )
            )

    # Process comment mention notifications
    actor = User.objects.get(pk=actor_id)
    for mention_id in comment_mentions:
        if mention_id != actor_id:
            in_app_preference = WorkspaceUserNotificationPreference.objects.filter(
                user_id=mention_id,
                workspace_id=issue_workspace_id,
                transport=NotificationTransportChoices.IN_APP[0],
            ).first()

            if in_app_preference.mention:
                for issue_activity in issue_activities_created:
                    notification = create_mention_notification(
                        project=project,
                        issue=issue,
                        notification_comment=f"{actor.display_name} has mentioned you in a comment in issue {issue.name}",
                        actor_id=actor_id,
                        mention_id=mention_id,
                        issue_id=issue.id,
                        activity=issue_activity,
                    )
                    bulk_notifications.append(notification)

    # Process issue mention notifications
    for mention_id in new_mentions:
        if mention_id != actor_id:
            in_app_preference = WorkspaceUserNotificationPreference.objects.filter(
                user_id=mention_id,
                workspace_id=issue_workspace_id,
                transport=NotificationTransportChoices.IN_APP[0],
            ).first()

            if not in_app_preference.mention:
                continue

            if (
                last_activity is not None
                and last_activity.field == "description"
                and actor_id == str(last_activity.actor_id)
            ):
                bulk_notifications.append(
                    Notification(
                        workspace=project.workspace,
                        sender="in_app:issue_activities:mentioned",
                        triggered_by_id=actor_id,
                        receiver_id=mention_id,
                        entity_identifier=issue.id,
                        entity_name="issue",
                        project=project,
                        message=f"You have been mentioned in the issue {issue.name}",
                        data=create_notification_data(issue, last_activity),
                    )
                )
            else:
                for issue_activity in issue_activities_created:
                    notification = create_mention_notification(
                        project=project,
                        issue=issue,
                        notification_comment=f"You have been mentioned in the issue {issue.name}",
                        actor_id=actor_id,
                        mention_id=mention_id,
                        issue_id=issue.id,
                        activity=issue_activity,
                    )
                    bulk_notifications.append(notification)

    return bulk_notifications


def create_email_notifications(
    issue,
    project,
    actor_id,
    issue_activities_created,
    issue_subscribers,
    issue_assignees,
    new_mentions,
    comment_mentions,
    last_activity,
    issue_workspace_id,
):
    """
    Create email notifications for issue activities and mentions.
    Returns a list of EmailNotificationLog objects to be bulk created.
    """
    bulk_email_logs = []

    # Process notifications for subscribers
    for subscriber in issue_subscribers:
        # Get user notification preferences for email
        email_preference = WorkspaceUserNotificationPreference.objects.filter(
            user_id=subscriber,
            workspace_id=issue_workspace_id,
            transport=NotificationTransportChoices.EMAIL[0],
        ).first()

        for issue_activity in issue_activities_created:
            # Skip if activity is not for this issue
            if issue_activity.get("issue_detail").get("id") != issue.id:
                continue

            # Skip description updates
            if issue_activity.get("field") == "description":
                continue

            # Check if notification should be sent based on preferences
            send_email = should_send_notification(
                email_preference, issue_activity.get("field")
            )

            if not send_email:
                continue

            # Get issue comment if relevant
            issue_comment = get_issue_comment_for_activity(
                issue_activity, issue.id, project.id, project.workspace_id
            )

            # Create email notification log
            bulk_email_logs.append(
                create_email_notification_log(
                    issue=issue,
                    actor_id=actor_id,
                    subscriber=subscriber,
                    issue_activity=issue_activity,
                    issue_comment=issue_comment,
                )
            )

    # Process comment mention notifications
    for mention_id in comment_mentions:
        if mention_id != actor_id:
            email_preference = WorkspaceUserNotificationPreference.objects.filter(
                user_id=mention_id,
                workspace_id=issue_workspace_id,
                transport=NotificationTransportChoices.EMAIL[0],
            ).first()

            if email_preference.mention:
                for issue_activity in issue_activities_created:
                    bulk_email_logs.append(
                        create_mention_email_log(
                            issue=issue,
                            actor_id=actor_id,
                            mention_id=mention_id,
                            issue_activity=issue_activity,
                            field="mention",
                        )
                    )

    # Process issue mention notifications
    for mention_id in new_mentions:
        if mention_id != actor_id:
            email_preference = WorkspaceUserNotificationPreference.objects.filter(
                user_id=mention_id,
                workspace_id=issue_workspace_id,
                transport=NotificationTransportChoices.EMAIL[0],
            ).first()

            if not email_preference.mention:
                continue

            if (
                last_activity is not None
                and last_activity.field == "description"
                and actor_id == str(last_activity.actor_id)
            ):
                bulk_email_logs.append(
                    EmailNotificationLog(
                        triggered_by_id=actor_id,
                        receiver_id=mention_id,
                        entity_identifier=issue.id,
                        entity_name="issue",
                        data=create_email_data_from_activity(
                            issue, last_activity, field="mention"
                        ),
                    )
                )
            else:
                for issue_activity in issue_activities_created:
                    bulk_email_logs.append(
                        create_mention_email_log(
                            issue=issue,
                            actor_id=actor_id,
                            mention_id=mention_id,
                            issue_activity=issue_activity,
                            field="mention",
                        )
                    )

    return bulk_email_logs


def should_send_notification(preference, field):
    """
    Determine if notification should be sent based on user preferences and activity field.
    """
    if field == "state":
        return preference.state_change
    elif field == "comment":
        return preference.comment
    elif field == "priority":
        return preference.priority
    elif field == "assignee":
        return preference.assignee
    elif field == "start_date" or field == "target_date":
        return preference.start_due_date
    else:
        return preference.property_change


def get_issue_comment_for_activity(issue_activity, issue_id, project_id, workspace_id):
    """
    Fetch issue comment for an activity if it exists.
    """
    if issue_activity.get("issue_comment"):
        return IssueComment.objects.filter(
            id=issue_activity.get("issue_comment"),
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
        ).first()
    return None


def create_activity_notification(
    project, issue, sender, actor_id, subscriber, issue_activity, issue_comment
):
    """
    Create a Notification object for an issue activity.
    """
    return Notification(
        workspace=project.workspace,
        sender=sender,
        triggered_by_id=actor_id,
        receiver_id=subscriber,
        entity_identifier=issue.id,
        entity_name="issue",
        project=project,
        title=issue_activity.get("comment"),
        data={
            "issue": {
                "id": str(issue.id),
                "name": str(issue.name),
                "identifier": str(issue.project.identifier),
                "sequence_id": issue.sequence_id,
                "state_name": issue.state.name,
                "state_group": issue.state.group,
            },
            "issue_activity": {
                "id": str(issue_activity.get("id")),
                "verb": str(issue_activity.get("verb")),
                "field": str(issue_activity.get("field")),
                "actor": str(issue_activity.get("actor_id")),
                "new_value": str(issue_activity.get("new_value")),
                "old_value": str(issue_activity.get("old_value")),
                "issue_comment": str(
                    issue_comment.comment_stripped if issue_comment is not None else ""
                ),
                "old_identifier": (
                    str(issue_activity.get("old_identifier"))
                    if issue_activity.get("old_identifier")
                    else None
                ),
                "new_identifier": (
                    str(issue_activity.get("new_identifier"))
                    if issue_activity.get("new_identifier")
                    else None
                ),
            },
        },
    )


def create_email_notification_log(
    issue, actor_id, subscriber, issue_activity, issue_comment
):
    """
    Create an EmailNotificationLog object for an issue activity.
    """
    return EmailNotificationLog(
        triggered_by_id=actor_id,
        receiver_id=subscriber,
        entity_identifier=issue.id,
        entity_name="issue",
        data={
            "issue": {
                "id": str(issue.id),
                "name": str(issue.name),
                "identifier": str(issue.project.identifier),
                "project_id": str(issue.project.id),
                "workspace_slug": str(issue.project.workspace.slug),
                "sequence_id": issue.sequence_id,
                "state_name": issue.state.name,
                "state_group": issue.state.group,
            },
            "issue_activity": {
                "id": str(issue_activity.get("id")),
                "verb": str(issue_activity.get("verb")),
                "field": str(issue_activity.get("field")),
                "actor": str(issue_activity.get("actor_id")),
                "new_value": str(issue_activity.get("new_value")),
                "old_value": str(issue_activity.get("old_value")),
                "issue_comment": str(
                    issue_comment.comment_stripped if issue_comment is not None else ""
                ),
                "old_identifier": (
                    str(issue_activity.get("old_identifier"))
                    if issue_activity.get("old_identifier")
                    else None
                ),
                "new_identifier": (
                    str(issue_activity.get("new_identifier"))
                    if issue_activity.get("new_identifier")
                    else None
                ),
                "activity_time": issue_activity.get("created_at"),
            },
        },
    )


def create_mention_email_log(issue, actor_id, mention_id, issue_activity, field):
    """
    Create an EmailNotificationLog for a mention notification.
    """
    return EmailNotificationLog(
        triggered_by_id=actor_id,
        receiver_id=mention_id,
        entity_identifier=issue.id,
        entity_name="issue",
        data={
            "issue": {
                "id": str(issue.id),
                "name": str(issue.name),
                "identifier": str(issue.project.identifier),
                "sequence_id": issue.sequence_id,
                "state_name": issue.state.name,
                "state_group": issue.state.group,
                "project_id": str(issue.project.id),
                "workspace_slug": str(issue.project.workspace.slug),
            },
            "issue_activity": {
                "id": str(issue_activity.get("id")),
                "verb": str(issue_activity.get("verb")),
                "field": str(field),
                "actor": str(issue_activity.get("actor_id")),
                "new_value": str(issue_activity.get("new_value")),
                "old_value": str(issue_activity.get("old_value")),
                "old_identifier": (
                    str(issue_activity.get("old_identifier"))
                    if issue_activity.get("old_identifier")
                    else None
                ),
                "new_identifier": (
                    str(issue_activity.get("new_identifier"))
                    if issue_activity.get("new_identifier")
                    else None
                ),
                "activity_time": issue_activity.get("created_at"),
            },
        },
    )


def create_notification_data(issue, activity):
    """
    Create a standard data structure for notifications.
    """
    return {
        "issue": {
            "id": str(issue.id),
            "name": str(issue.name),
            "identifier": str(issue.project.identifier),
            "sequence_id": issue.sequence_id,
            "state_name": issue.state.name,
            "state_group": issue.state.group,
            "project_id": str(issue.project.id),
            "workspace_slug": str(issue.project.workspace.slug),
        },
        "issue_activity": {
            "id": str(activity.id),
            "verb": str(activity.verb),
            "field": str(activity.field),
            "actor": str(activity.actor_id),
            "new_value": str(activity.new_value),
            "old_value": str(activity.old_value),
            "old_identifier": (
                str(activity.get("old_identifier"))
                if activity.get("old_identifier")
                else None
            ),
            "new_identifier": (
                str(activity.get("new_identifier"))
                if activity.get("new_identifier")
                else None
            ),
        },
    }


def create_email_data_from_activity(issue, activity, field=None):
    """
    Create a standard data structure for email notifications.
    """
    return {
        "issue": {
            "id": str(issue.id),
            "name": str(issue.name),
            "identifier": str(issue.project.identifier),
            "sequence_id": issue.sequence_id,
            "state_name": issue.state.name,
            "state_group": issue.state.group,
            "project_id": str(issue.project.id),
            "workspace_slug": str(issue.project.workspace.slug),
        },
        "issue_activity": {
            "id": str(activity.id),
            "verb": str(activity.verb),
            "field": str(field or activity.field),
            "actor": str(activity.actor_id),
            "new_value": str(activity.new_value),
            "old_value": str(activity.old_value),
            "old_identifier": (
                str(activity.get("old_identifier"))
                if activity.get("old_identifier")
                else None
            ),
            "new_identifier": (
                str(activity.get("new_identifier"))
                if activity.get("new_identifier")
                else None
            ),
            "activity_time": str(activity.created_at),
        },
    }


@shared_task
def notifications(
    type,
    issue_id,
    project_id,
    actor_id,
    subscriber,
    issue_activities_created,
    requested_data,
    current_instance,
):
    try:
        issue_activities_created = (
            json.loads(issue_activities_created)
            if issue_activities_created is not None
            else None
        )

        # Skip processing for certain activity types
        if type in [
            "cycle.activity.created",
            "cycle.activity.deleted",
            "module.activity.created",
            "module.activity.deleted",
            "issue_reaction.activity.created",
            "issue_reaction.activity.deleted",
            "comment_reaction.activity.created",
            "comment_reaction.activity.deleted",
            "issue_vote.activity.created",
            "issue_vote.activity.deleted",
            "issue_draft.activity.created",
            "issue_draft.activity.updated",
            "issue_draft.activity.deleted",
        ]:
            return

        # Get project and issue information
        project = Project.objects.get(pk=project_id)
        issue = Issue.objects.filter(pk=issue_id).first()
        issue_workspace_id = project.workspace_id

        # Get project members
        project_members = ProjectMember.objects.filter(
            project_id=project_id, is_active=True
        ).values_list("member_id", flat=True)

        # Handle mentions
        mention_data = process_mentions(
            requested_data=requested_data,
            current_instance=current_instance,
            project_id=project_id,
            issue_id=issue_id,
            project_members=project_members,
            issue_activities_created=issue_activities_created,
        )

        new_mentions = mention_data["new_mentions"]
        removed_mention = mention_data["removed_mention"]
        comment_mentions = mention_data["comment_mentions"]
        mention_subscribers = mention_data["mention_subscribers"]
        comment_mention_subscribers = mention_data["comment_mention_subscribers"]

        # Add the actor as a subscriber if needed
        if subscriber:
            try:
                _ = IssueSubscriber.objects.get_or_create(
                    project_id=project_id, issue_id=issue_id, subscriber_id=actor_id
                )
            except Exception:
                pass

        # Get issue subscribers excluding mentioned users and actor
        issue_subscribers = list(
            IssueSubscriber.objects.filter(
                project_id=project_id,
                issue_id=issue_id,
                subscriber__in=Subquery(project_members),
            )
            .exclude(
                subscriber_id__in=list(new_mentions + comment_mentions + [actor_id])
            )
            .values_list("subscriber", flat=True)
        )

        issue_assignees = IssueAssignee.objects.filter(
            issue_id=issue_id,
            project_id=project_id,
            assignee__in=Subquery(project_members),
        ).values_list("assignee", flat=True)

        issue_subscribers = list(set(issue_subscribers) - {uuid.UUID(actor_id)})

        # Add Mentioned users as Issue Subscribers
        IssueSubscriber.objects.bulk_create(
            mention_subscribers + comment_mention_subscribers,
            batch_size=100,
            ignore_conflicts=True,
        )

        # Update mentions for the issue
        update_mentions_for_issue(
            issue=issue,
            project=project,
            new_mentions=new_mentions,
            removed_mention=removed_mention,
        )

        # Create and send notifications for each transport type
        last_activity = (
            IssueActivity.objects.filter(issue_id=issue_id)
            .order_by("-created_at")
            .first()
        )

        # Process in-app notifications
        in_app_notifications = create_in_app_notifications(
            issue=issue,
            project=project,
            actor_id=actor_id,
            issue_activities_created=issue_activities_created,
            issue_subscribers=issue_subscribers,
            issue_assignees=issue_assignees,
            new_mentions=new_mentions,
            comment_mentions=comment_mentions,
            last_activity=last_activity,
            issue_workspace_id=issue_workspace_id,
        )

        # Process email notifications
        email_notifications = create_email_notifications(
            issue=issue,
            project=project,
            actor_id=actor_id,
            issue_activities_created=issue_activities_created,
            issue_subscribers=issue_subscribers,
            issue_assignees=issue_assignees,
            new_mentions=new_mentions,
            comment_mentions=comment_mentions,
            last_activity=last_activity,
            issue_workspace_id=issue_workspace_id,
        )

        # Bulk create notifications for each transport type
        Notification.objects.bulk_create(in_app_notifications, batch_size=100)
        EmailNotificationLog.objects.bulk_create(
            email_notifications, batch_size=100, ignore_conflicts=True
        )

        return
    except Exception as e:
        print(e)
        return
