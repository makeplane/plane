# All the python scripts that are used for back migrations
import uuid
import random
from django.contrib.auth.hashers import make_password
from plane.db.models import ProjectIdentifier
from plane.db.models import (
    Issue,
    IssueComment,
    User,
    Project,
    ProjectMember,
    Label,
    Integration,
)


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
            updated_issues,
            ["description_html", "description_stripped"],
            batch_size=100,
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
            issue_comment.comment_html = (
                f"<p>{issue_comment.comment_stripped}</p>"
            )
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
        project_identifiers = ProjectIdentifier.objects.filter(
            workspace_id=None
        ).select_related("project", "project__workspace")
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


def update_user_empty_password():
    try:
        users = User.objects.filter(password="")
        updated_users = []

        for user in users:
            user.password = make_password(uuid.uuid4().hex)
            user.is_password_autoset = True
            updated_users.append(user)

        User.objects.bulk_update(updated_users, ["password"], batch_size=50)
        print("Success")

    except Exception as e:
        print(e)
        print("Failed")


def updated_issue_sort_order():
    try:
        issues = Issue.objects.all()
        updated_issues = []

        for issue in issues:
            issue.sort_order = issue.sequence_id * random.randint(100, 500)
            updated_issues.append(issue)

        Issue.objects.bulk_update(
            updated_issues, ["sort_order"], batch_size=100
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")


def update_project_cover_images():
    try:
        project_cover_images = [
            "https://images.unsplash.com/photo-1677432658720-3d84f9d657b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1661107564401-57497d8fe86f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80",
            "https://images.unsplash.com/photo-1677352241429-dc90cfc7a623?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80",
            "https://images.unsplash.com/photo-1677196728306-eeafea692454?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1331&q=80",
            "https://images.unsplash.com/photo-1660902179734-c94c944f7830?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1255&q=80",
            "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1677040628614-53936ff66632?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1676920410907-8d5f8dd4b5ba?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80",
            "https://images.unsplash.com/photo-1676846328604-ce831c481346?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1155&q=80",
            "https://images.unsplash.com/photo-1676744843212-09b7e64c3a05?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1676798531090-1608bedeac7b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1597088758740-56fd7ec8a3f0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80",
            "https://images.unsplash.com/photo-1676638392418-80aad7c87b96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
            "https://images.unsplash.com/photo-1649639194967-2fec0b4ea7bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1675883086902-b453b3f8146e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
            "https://images.unsplash.com/photo-1675887057159-40fca28fdc5d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1173&q=80",
            "https://images.unsplash.com/photo-1675373980203-f84c5a672aa5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1675191475318-d2bf6bad1200?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80",
            "https://images.unsplash.com/photo-1675456230532-2194d0c4bcc0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1675371788315-60fa0ef48267?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80",
        ]

        projects = Project.objects.all()
        updated_projects = []
        for project in projects:
            project.cover_image = project_cover_images[random.randint(0, 19)]
            updated_projects.append(project)

        Project.objects.bulk_update(
            updated_projects, ["cover_image"], batch_size=100
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")


def update_user_view_property():
    try:
        project_members = ProjectMember.objects.all()
        updated_project_members = []
        for project_member in project_members:
            project_member.default_props = {
                "filters": {"type": None},
                "orderBy": "-created_at",
                "collapsed": True,
                "issueView": "list",
                "filterIssue": None,
                "groupByProperty": None,
                "showEmptyGroups": True,
            }
            updated_project_members.append(project_member)

        ProjectMember.objects.bulk_update(
            updated_project_members, ["default_props"], batch_size=100
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")


def update_label_color():
    try:
        labels = Label.objects.filter(color="")
        updated_labels = []
        for label in labels:
            label.color = "#" + "%06x" % random.randint(0, 0xFFFFFF)
            updated_labels.append(label)

        Label.objects.bulk_update(updated_labels, ["color"], batch_size=100)
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")


def create_slack_integration():
    try:
        _ = Integration.objects.create(
            provider="slack", network=2, title="Slack"
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")


def update_integration_verified():
    try:
        integrations = Integration.objects.all()
        updated_integrations = []
        for integration in integrations:
            integration.verified = True
            updated_integrations.append(integration)

        Integration.objects.bulk_update(
            updated_integrations, ["verified"], batch_size=10
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")


def update_start_date():
    try:
        issues = Issue.objects.filter(
            state__group__in=["started", "completed"]
        )
        updated_issues = []
        for issue in issues:
            issue.start_date = issue.created_at.date()
            updated_issues.append(issue)
        Issue.objects.bulk_update(
            updated_issues, ["start_date"], batch_size=500
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")
