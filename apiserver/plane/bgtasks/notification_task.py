# Python imports
import json

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import IssueSubscriber, Project, IssueAssignee, Issue, Notification

# Third Party imports
from celery import shared_task


@shared_task
def notifications(type, issue_id, project_id, actor_id, subscriber, issue_activities_created):
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
        issue_subscribers = list(
            IssueSubscriber.objects.filter(project_id=project_id, issue_id=issue_id)
            .exclude(subscriber_id=actor_id)
            .values_list("subscriber", flat=True)
        )

        issue_assignees = list(
            IssueAssignee.objects.filter(project_id=project_id, issue_id=issue_id)
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
                                    issue_activity.get("issue_comment").comment_stripped
                                    if issue_activity.get("issue_comment") is not None
                                    else ""
                                ),
                            },
                        },
                    )
                )

        # Bulk create notifications
        Notification.objects.bulk_create(bulk_notifications, batch_size=100)
