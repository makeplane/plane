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
    State,
    EmailNotificationLog,
    Notification,
    IssueComment,
    IssueActivity,
    UserNotificationPreference,
    ProjectMember,
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
    new_mentions = [mention for mention in mentions_newer if mention not in mentions_older]

    return new_mentions


# Get Removed Mention
def get_removed_mentions(requested_instance, current_instance):
    # requested_data is the newer instance of the current issue
    # current_instance is the older instance of the current issue, saved in the database

    # extract mentions from both the instance of data
    mentions_older = extract_mentions(current_instance)
    mentions_newer = extract_mentions(requested_instance)

    # Getting Set Difference from mentions_newer
    removed_mentions = [mention for mention in mentions_older if mention not in mentions_newer]

    return removed_mentions


# Adds mentions as subscribers
def extract_mentions_as_subscribers(project_id, issue_id, mentions):
    # mentions is an array of User IDs representing the FILTERED set of mentioned users

    bulk_mention_subscribers = []

    for mention_id in mentions:
        # If the particular mention has not already been subscribed to the issue, he must be sent the mentioned notification # noqa: E501
        if (
            not IssueSubscriber.objects.filter(
                issue_id=issue_id, subscriber_id=mention_id, project_id=project_id
            ).exists()
            and not IssueAssignee.objects.filter(
                project_id=project_id, issue_id=issue_id, assignee_id=mention_id
            ).exists()
            and not Issue.objects.filter(project_id=project_id, pk=issue_id, created_by_id=mention_id).exists()
            and ProjectMember.objects.filter(project_id=project_id, member_id=mention_id, is_active=True).exists()
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
        # issue_instance has to be a dictionary passed, containing the description_html and other set of activity data. # noqa: E501
        mentions = []
        # Convert string to dictionary
        data = json.loads(issue_instance)
        html = data.get("description_html")
        soup = BeautifulSoup(html, "html.parser")
        mention_tags = soup.find_all("mention-component", attrs={"entity_name": "user_mention"})

        mentions = [mention_tag["entity_identifier"] for mention_tag in mention_tags]

        return list(set(mentions))
    except Exception:
        return []


# =========== Comment Parsing and notification Functions ======================
def extract_comment_mentions(comment_value):
    try:
        mentions = []
        soup = BeautifulSoup(comment_value, "html.parser")
        mentions_tags = soup.find_all("mention-component", attrs={"entity_name": "user_mention"})
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
    new_mentions = [mention for mention in mentions_newer if mention not in mentions_older]

    return new_mentions


def create_mention_notification(project, notification_comment, issue, actor_id, mention_id, issue_id, activity):
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
                "old_identifier": (str(activity.get("old_identifier")) if activity.get("old_identifier") else None),
                "new_identifier": (str(activity.get("new_identifier")) if activity.get("new_identifier") else None),
            },
        },
    )


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
            json.loads(issue_activities_created) if issue_activities_created is not None else None
        )
        if type not in [
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
            # Create Notifications
            bulk_notifications = []
            bulk_email_logs = []

            """
            Mention Tasks
            1. Perform Diffing and Extract the mentions, that mention notification needs to be sent
            2. From the latest set of mentions, extract the users which are not a subscribers & make them subscribers
            """

            # get the list of active project members
            project_members = ProjectMember.objects.filter(project_id=project_id, is_active=True).values_list(
                "member_id", flat=True
            )

            # Get new mentions from the newer instance
            new_mentions = get_new_mentions(requested_instance=requested_data, current_instance=current_instance)
            new_mentions = list(set(new_mentions) & {str(member) for member in project_members})
            removed_mention = get_removed_mentions(requested_instance=requested_data, current_instance=current_instance)

            comment_mentions = []
            all_comment_mentions = []

            # Get New Subscribers from the mentions of the newer instance
            requested_mentions = extract_mentions(issue_instance=requested_data)
            mention_subscribers = extract_mentions_as_subscribers(
                project_id=project_id, issue_id=issue_id, mentions=requested_mentions
            )

            for issue_activity in issue_activities_created:
                issue_comment = issue_activity.get("issue_comment")
                issue_comment_new_value = issue_activity.get("new_value")
                issue_comment_old_value = issue_activity.get("old_value")
                if issue_comment is not None:
                    # TODO: Maybe save the comment mentions, so that in future, we can filter out the issues based on comment mentions as well.

                    all_comment_mentions = all_comment_mentions + extract_comment_mentions(issue_comment_new_value)

                    new_comment_mentions = get_new_comment_mentions(
                        old_value=issue_comment_old_value,
                        new_value=issue_comment_new_value,
                    )
                    comment_mentions = comment_mentions + new_comment_mentions
                    comment_mentions = [
                        mention for mention in comment_mentions if UUID(mention) in set(project_members)
                    ]

            comment_mention_subscribers = extract_mentions_as_subscribers(
                project_id=project_id, issue_id=issue_id, mentions=all_comment_mentions
            )
            """
            We will not send subscription activity notification to the below mentioned user sets
            - Those who have been newly mentioned in the issue description, we will send mention notification to them.
            - When the activity is a comment_created and there exist a mention in the comment, 
              then we have to send the "mention_in_comment" notification
            - When the activity is a comment_updated and there exist a mention change, 
              then also we have to send the "mention_in_comment" notification
            """

            # ---------------------------------------------------------------------------------------------------------
            issue_subscribers = list(
                IssueSubscriber.objects.filter(
                    project_id=project_id,
                    issue_id=issue_id,
                    subscriber__in=Subquery(project_members),
                )
                .exclude(subscriber_id__in=list(new_mentions + comment_mentions + [actor_id]))
                .values_list("subscriber", flat=True)
            )

            issue = Issue.objects.filter(pk=issue_id).first()

            if subscriber:
                # add the user to issue subscriber
                try:
                    _ = IssueSubscriber.objects.get_or_create(
                        project_id=project_id, issue_id=issue_id, subscriber_id=actor_id
                    )
                except Exception:
                    pass

            project = Project.objects.get(pk=project_id)

            issue_assignees = IssueAssignee.objects.filter(
                issue_id=issue_id,
                project_id=project_id,
                assignee__in=Subquery(project_members),
            ).values_list("assignee", flat=True)

            issue_subscribers = list(set(issue_subscribers) - {uuid.UUID(actor_id)})

            for subscriber in issue_subscribers:
                if issue.created_by_id and issue.created_by_id == subscriber:
                    sender = "in_app:issue_activities:created"
                elif subscriber in issue_assignees and issue.created_by_id not in issue_assignees:
                    sender = "in_app:issue_activities:assigned"
                else:
                    sender = "in_app:issue_activities:subscribed"

                preference = UserNotificationPreference.objects.get(user_id=subscriber)

                for issue_activity in issue_activities_created:
                    # If activity done in blocking then blocked by email should not go
                    if issue_activity.get("issue_detail").get("id") != issue_id:
                        continue

                    # Do not send notification for description update
                    if issue_activity.get("field") == "description":
                        continue

                    # Check if the value should be sent or not
                    send_email = False
                    if issue_activity.get("field") == "state" and preference.state_change:
                        send_email = True
                    elif (
                        issue_activity.get("field") == "state"
                        and preference.issue_completed
                        and State.objects.filter(
                            project_id=project_id,
                            pk=issue_activity.get("new_identifier"),
                            group="completed",
                        ).exists()
                    ):
                        send_email = True
                    elif issue_activity.get("field") == "comment" and preference.comment:
                        send_email = True
                    elif preference.property_change:
                        send_email = True
                    else:
                        send_email = False

                    # If activity is of issue comment fetch the comment
                    issue_comment = (
                        IssueComment.objects.filter(
                            id=issue_activity.get("issue_comment"),
                            issue_id=issue_id,
                            project_id=project_id,
                            workspace_id=project.workspace_id,
                        ).first()
                        if issue_activity.get("issue_comment")
                        else None
                    )

                    # Create in app notification
                    bulk_notifications.append(
                        Notification(
                            workspace=project.workspace,
                            sender=sender,
                            triggered_by_id=actor_id,
                            receiver_id=subscriber,
                            entity_identifier=issue_id,
                            entity_name="issue",
                            project=project,
                            title=issue_activity.get("comment"),
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
                    )
                    # Create email notification
                    if send_email:
                        bulk_email_logs.append(
                            EmailNotificationLog(
                                triggered_by_id=actor_id,
                                receiver_id=subscriber,
                                entity_identifier=issue_id,
                                entity_name="issue",
                                data={
                                    "issue": {
                                        "id": str(issue_id),
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
                        )

            # -------------------------------------------------------------------------------------------------------- #

            # Add Mentioned as Issue Subscribers
            IssueSubscriber.objects.bulk_create(
                mention_subscribers + comment_mention_subscribers,
                batch_size=100,
                ignore_conflicts=True,
            )

            last_activity = IssueActivity.objects.filter(issue_id=issue_id).order_by("-created_at").first()

            actor = User.objects.get(pk=actor_id)

            for mention_id in comment_mentions:
                if mention_id != actor_id:
                    preference = UserNotificationPreference.objects.get(user_id=mention_id)
                    for issue_activity in issue_activities_created:
                        notification = create_mention_notification(
                            project=project,
                            issue=issue,
                            notification_comment=f"{actor.display_name} has mentioned you in a comment in issue {issue.name}",  # noqa: E501
                            actor_id=actor_id,
                            mention_id=mention_id,
                            issue_id=issue_id,
                            activity=issue_activity,
                        )

                        # check for email notifications
                        if preference.mention:
                            bulk_email_logs.append(
                                EmailNotificationLog(
                                    triggered_by_id=actor_id,
                                    receiver_id=mention_id,
                                    entity_identifier=issue_id,
                                    entity_name="issue",
                                    data={
                                        "issue": {
                                            "id": str(issue_id),
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
                                            "field": str("mention"),
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
                            )
                        bulk_notifications.append(notification)

            for mention_id in new_mentions:
                if mention_id != actor_id:
                    preference = UserNotificationPreference.objects.get(user_id=mention_id)
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
                                entity_identifier=issue_id,
                                entity_name="issue",
                                project=project,
                                message=f"You have been mentioned in the issue {issue.name}",
                                data={
                                    "issue": {
                                        "id": str(issue_id),
                                        "name": str(issue.name),
                                        "identifier": str(issue.project.identifier),
                                        "sequence_id": issue.sequence_id,
                                        "state_name": issue.state.name,
                                        "state_group": issue.state.group,
                                        "project_id": str(issue.project.id),
                                        "workspace_slug": str(issue.project.workspace.slug),
                                    },
                                    "issue_activity": {
                                        "id": str(last_activity.id),
                                        "verb": str(last_activity.verb),
                                        "field": str(last_activity.field),
                                        "actor": str(last_activity.actor_id),
                                        "new_value": str(last_activity.new_value),
                                        "old_value": str(last_activity.old_value),
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
                        )
                        if preference.mention:
                            bulk_email_logs.append(
                                EmailNotificationLog(
                                    triggered_by_id=actor_id,
                                    receiver_id=subscriber,
                                    entity_identifier=issue_id,
                                    entity_name="issue",
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
                                            "id": str(last_activity.id),
                                            "verb": str(last_activity.verb),
                                            "field": "mention",
                                            "actor": str(last_activity.actor_id),
                                            "new_value": str(last_activity.new_value),
                                            "old_value": str(last_activity.old_value),
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
                                            "activity_time": str(last_activity.created_at),
                                        },
                                    },
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
                                issue_id=issue_id,
                                activity=issue_activity,
                            )
                            if preference.mention:
                                bulk_email_logs.append(
                                    EmailNotificationLog(
                                        triggered_by_id=actor_id,
                                        receiver_id=subscriber,
                                        entity_identifier=issue_id,
                                        entity_name="issue",
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
                                                "id": str(issue_activity.get("id")),
                                                "verb": str(issue_activity.get("verb")),
                                                "field": str("mention"),
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
                                )
                            bulk_notifications.append(notification)

            # save new mentions for the particular issue and remove the mentions that has been deleted from the description # noqa: E501
            update_mentions_for_issue(
                issue=issue,
                project=project,
                new_mentions=new_mentions,
                removed_mention=removed_mention,
            )
            # Bulk create notifications
            Notification.objects.bulk_create(bulk_notifications, batch_size=100)
            EmailNotificationLog.objects.bulk_create(bulk_email_logs, batch_size=100, ignore_conflicts=True)
        return
    except Exception as e:
        print(e)
        return
