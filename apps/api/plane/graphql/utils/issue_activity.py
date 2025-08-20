# Third-party imports
from asgiref.sync import sync_to_async
from bs4 import BeautifulSoup

# Module imports
from plane.db.models import User, IssueLabel, IssueAssignee


@sync_to_async
def get_issue_labels(issue):
    label_ids = IssueLabel.objects.filter(
        issue=issue, deleted_at__isnull=True
    ).values_list("label_id", flat=True)

    return [str(label_id) for label_id in label_ids]


@sync_to_async
def get_issue_assignees(issue):
    assignee_ids = IssueAssignee.objects.filter(
        issue=issue, deleted_at__isnull=True
    ).values_list("assignee_id", flat=True)

    return [str(assignee_id) for assignee_id in assignee_ids]


# issue properties to activity dict
async def convert_issue_properties_to_activity_dict(issue):
    current_issue_activity_labels = await get_issue_labels(issue)
    current_issue_activity_assignees = await get_issue_assignees(issue)

    current_issue_activity = {
        "name": issue.name,
        "description_html": issue.description_html,
        "priority": issue.priority,
        "state_id": str(issue.state_id),
        "parent_id": str(issue.parent_id) if issue.parent_id is not None else None,
        "estimate_point": str(issue.estimate_point_id)
        if issue.estimate_point_id is not None
        else None,
        "start_date": issue.start_date.strftime("%Y-%m-%d")
        if issue.start_date is not None
        else None,
        "target_date": issue.target_date.strftime("%Y-%m-%d")
        if issue.target_date is not None
        else None,
        "label_ids": current_issue_activity_labels,
        "assignee_ids": current_issue_activity_assignees,
    }

    return current_issue_activity


# issue relation properties to activity dict
async def convert_issue_relation_properties_to_activity_dict(issue_relation):
    return {
        "issue_id": str(issue_relation.issue_id),
        "related_issue_id": str(issue_relation.related_issue_id),
        "relation_type": issue_relation.relation_type,
    }


def issue_activity_comment_string(html_content):
    soup = BeautifulSoup(html_content, "html.parser")

    user_mentions = {}

    for mention_tag in soup.find_all(
        "mention-component", attrs={"entity_name": "user_mention"}
    ):
        entity_identifier = mention_tag.get("entity_identifier", "")

        user = User.objects.filter(id=entity_identifier).first()

        user_mentions[entity_identifier] = user if user else None

        mention_tag.replace_with(
            user.display_name
            if user.display_name
            else user.first_name
            if user.first_name
            else user.email
            if user
            else ""
        )

    for tag in soup.find_all(True):
        tag.replace_with(tag.text)

    plain_text = soup.get_text()

    return {"mention_objects": user_mentions, "content": plain_text}
