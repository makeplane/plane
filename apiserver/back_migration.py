# All the python scripts that are used for back migrations
from plane.db.models import ProjectIdentifier
from plane.db.models import Issue, IssueComment

# Update description and description html values for old descriptions
def update_description():
    try:

        issues = Issue.objects.all()
        updated_issues = []

        for issue in issues:
            issue.description_html = f"<p>{issue.description}</p>"
            issue.description_stripped = issue.description
            updated_issues.append(issue)

        Issue.objects.bulk_update(
            updated_issues, ["description_html", "description_stripped"], batch_size=100
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")


def update_comments():
    try:

        issue_comments = IssueComment.objects.all()
        updated_issue_comments = []

        for issue_comment in issue_comments:
            issue_comment.comment_html = f"<p>{issue_comment.comment_stripped}</p>"
            updated_issue_comments.append(issue_comment)

        IssueComment.objects.bulk_update(
            updated_issue_comments, ["comment_html"], batch_size=100
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")


def update_project_identifiers():
    try:
        project_identifiers = ProjectIdentifier.objects.filter(workspace_id=None).select_related("project", "project__workspace")
        updated_identifiers = []
    
        for identifier in project_identifiers:
            identifier.workspace_id = identifier.project.workspace_id
            updated_identifiers.append(identifier)

        ProjectIdentifier.objects.bulk_update(
            updated_identifiers, ["workspace_id"], batch_size=50
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")
