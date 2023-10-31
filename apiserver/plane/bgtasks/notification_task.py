# Python imports
import json

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import IssueMention, IssueSubscriber, Project, User, IssueAssignee, Issue, Notification

# Third Party imports
from celery import shared_task
from bs4 import BeautifulSoup


def get_new_mentions(requested_instance, current_instance):
    # requested_data is the newer instance of the current issue
    # current_instance is the older instance of the current issue, saved in the database

    # extract mentions from both the instance of data
    mentions_older = extract_mentions(current_instance)
    mentions_newer = extract_mentions(requested_instance)

    # Getting Set Difference from mentions_newer
    new_mentions = [
        mention for mention in mentions_newer if mention not in mentions_older]

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
        mention for mention in mentions_older if mention not in mentions_newer]

    return removed_mentions

# Adds mentions as subscribers


def extract_mentions_as_subscribers(project_id, issue_id, mentions):
    # mentions is an array of User IDs representing the FILTERED set of mentioned users

    bulk_mention_subscribers = []

    for mention_id in mentions:
        # If the particular mention has not already been subscribed to the issue, he must be sent the mentioned notification
        if not IssueSubscriber.objects.filter(
            issue_id=issue_id,
            subscriber=mention_id,
            project=project_id,
        ).exists():
            mentioned_user = User.objects.get(pk=mention_id)

            project = Project.objects.get(pk=project_id)
            issue = Issue.objects.get(pk=issue_id)

            bulk_mention_subscribers.append(IssueSubscriber(
                workspace=project.workspace,
                project=project,
                issue=issue,
                subscriber=mentioned_user,
            ))
    return bulk_mention_subscribers

# Parse Issue Description & extracts mentions


def extract_mentions(issue_instance):
    try:
        # issue_instance has to be a dictionary passed, containing the description_html and other set of activity data.
        mentions = []
        # Convert string to dictionary
        data = json.loads(issue_instance)
        html = data.get("description_html")
        soup = BeautifulSoup(html, 'html.parser')
        mention_tags = soup.find_all(
            'mention-component', attrs={'target': 'users'})

        mentions = [mention_tag['id'] for mention_tag in mention_tags]

        return list(set(mentions))
    except Exception as e:
        return []


@shared_task
def notifications(type, issue_id, project_id, actor_id, subscriber, issue_activities_created, requested_data, current_instance):
    issue_activities_created = (
        json.loads(
            issue_activities_created) if issue_activities_created is not None else None
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

        """
            Mention Tasks
            1. Perform Diffing and Extract the mentions, that mention notification needs to be sent
            2. From the latest set of mentions, extract the users which are not a subscribers & make them subscribers
            """

        # Get new mentions from the newer instance
        new_mentions = get_new_mentions(
            requested_instance=requested_data, current_instance=current_instance)
        removed_mention = get_removed_mentions(
            requested_instance=requested_data, current_instance=current_instance)

        # Get New Subscribers from the mentions of the newer instance
        requested_mentions = extract_mentions(
            issue_instance=requested_data)
        mention_subscribers = extract_mentions_as_subscribers(
            project_id=project_id, issue_id=issue_id, mentions=requested_mentions)

        issue_subscribers = list(
            IssueSubscriber.objects.filter(
                project_id=project_id, issue_id=issue_id)
            .exclude(subscriber_id__in=list(new_mentions + [actor_id]))
            .values_list("subscriber", flat=True)
        )

        issue_assignees = list(
            IssueAssignee.objects.filter(
                project_id=project_id, issue_id=issue_id)
            .exclude(assignee_id=actor_id)
            .values_list("assignee", flat=True)
        )

        issue_subscribers = issue_subscribers + issue_assignees

        issue = Issue.objects.filter(pk=issue_id).first()

        if subscriber:
            # add the user to issue subscriber
            try:
                _ = IssueSubscriber.objects.get_or_create(
                    issue_id=issue_id, subscriber_id=actor_id
                )
            except Exception as e:
                pass

        project = Project.objects.get(pk=project_id)

        for subscriber in list(set(issue_subscribers)):
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
                                    issue_activity.get(
                                        "issue_comment").comment_stripped
                                    if issue_activity.get("issue_comment") is not None
                                    else ""
                                ),
                            },
                        },
                    )
                )

        # Add Mentioned as Issue Subscribers
        IssueSubscriber.objects.bulk_create(
            mention_subscribers, batch_size=100)

        for mention_id in new_mentions:
            if (mention_id != actor_id):
                for issue_activity in issue_activities_created:
                    bulk_notifications.append(
                        Notification(
                            workspace=project.workspace,
                            sender="in_app:issue_activities:mention",
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
                                },
                                "issue_activity": {
                                    "id": str(issue_activity.get("id")),
                                    "verb": str(issue_activity.get("verb")),
                                    "field": str(issue_activity.get("field")),
                                    "actor": str(issue_activity.get("actor_id")),
                                    "new_value": str(issue_activity.get("new_value")),
                                    "old_value": str(issue_activity.get("old_value")),
                                },
                            },
                        )
                    )

        # Create New Mentions Here
        aggregated_issue_mentions = []

        for mention_id in new_mentions:
            mentioned_user = User.objects.get(pk=mention_id)
            aggregated_issue_mentions.append(
                IssueMention(
                    mention=mentioned_user,
                    issue=issue,
                    project=project,
                    workspace=project.workspace
                )
            )

        IssueMention.objects.bulk_create(
            aggregated_issue_mentions, batch_size=100)
        IssueMention.objects.filter(
            issue=issue.id, mention__in=removed_mention).delete()

        # Bulk create notifications
        Notification.objects.bulk_create(bulk_notifications, batch_size=100)
