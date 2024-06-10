# Python imports
import json
from datetime import datetime

# Django imports
from django.utils import timezone

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseAPIView
from plane.app.permissions import (
    ProjectEntityPermission,
)
from plane.db.models import (
    Project,
    Issue,
    IssueLabel,
    IssueAssignee,
)
from plane.bgtasks.issue_activites_task import issue_activity


class BulkIssueOperationsEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])
        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all the issues
        issues = (
            Issue.objects.filter(
                workspace__slug=slug, project_id=project_id, pk__in=issue_ids
            )
            .select_related("state")
            .prefetch_related("labels", "assignees")
        )
        # Current epoch
        epoch = int(timezone.now().timestamp())

        # Project details
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        workspace_id = project.workspace_id

        # Initialize arrays
        bulk_update_issues = []
        bulk_issue_activities = []
        bulk_update_issue_labels = []
        bulk_update_issue_assignees = []

        properties = request.data.get("properties", {})

        if properties.get("start_date", False) and properties.get("target_date", False):
            if (
                datetime.strptime(properties.get("start_date"), "%Y-%m-%d").date()
                > datetime.strptime(properties.get("target_date"), "%Y-%m-%d").date()
            ):
                return Response(
                    {
                        "error_code": 4100,
                        "error_message": "INVALID_ISSUE_DATES",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        for issue in issues:

            # Priority
            if properties.get("priority", False):
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"priority": properties.get("priority")}
                        ),
                        "current_instance": json.dumps(
                            {"priority": (issue.priority)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.priority = properties.get("priority")

            # State
            if properties.get("state_id", False):
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"state": properties.get("state")}
                        ),
                        "current_instance": json.dumps(
                            {"state": str(issue.state_id)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.state_id = properties.get("state_id")

            # Start date
            if properties.get("start_date", False):
                if (
                    issue.target_date
                    and not properties.get("target_date", False)
                    and issue.target_date
                    <= datetime.strptime(
                        properties.get("start_date"), "%Y-%m-%d"
                    ).date()
                ):
                    return Response(
                        {
                            "error_code": 4101,
                            "error_message": "INVALID_ISSUE_START_DATE",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"start_date": properties.get("start_date")}
                        ),
                        "current_instance": json.dumps(
                            {"start_date": str(issue.start_date)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.start_date = properties.get("start_date")

            # Target date
            if properties.get("target_date", False):
                if (
                    issue.start_date
                    and not properties.get("start_date", False)
                    and issue.start_date
                    >= datetime.strptime(
                        properties.get("target_date"), "%Y-%m-%d"
                    ).date()
                ):
                    return Response(
                        {
                            "error_code": 4102,
                            "error_message": "INVALID_ISSUE_TARGET_DATE",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"target_date": properties.get("target_date")}
                        ),
                        "current_instance": json.dumps(
                            {"target_date": str(issue.target_date)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.target_date = properties.get("target_date")

            bulk_update_issues.append(issue)

            # Labels
            if properties.get("label_ids", []):
                for label_id in properties.get("label_ids", []):
                    bulk_update_issue_labels.append(
                        IssueLabel(
                            issue=issue,
                            label_id=label_id,
                            created_by=request.user,
                            project_id=project_id,
                            workspace_id=workspace_id,
                        )
                    )
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"label_ids": properties.get("label_ids", [])}
                        ),
                        "current_instance": json.dumps(
                            {
                                "label_ids": [
                                    str(label.id)
                                    for label in issue.labels.all()
                                ]
                            }
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )

            # Assignees
            if properties.get("assignee_ids", []):
                for assignee_id in properties.get(
                    "assignee_ids", issue.assignees
                ):
                    bulk_update_issue_assignees.append(
                        IssueAssignee(
                            issue=issue,
                            assignee_id=assignee_id,
                            created_by=request.user,
                            project_id=project_id,
                            workspace_id=workspace_id,
                        )
                    )
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {
                                "assignee_ids": properties.get(
                                    "assignee_ids", []
                                )
                            }
                        ),
                        "current_instance": json.dumps(
                            {
                                "assignee_ids": [
                                    str(assignee.id)
                                    for assignee in issue.assignees.all()
                                ]
                            }
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )

        # Bulk update all the objects
        Issue.objects.bulk_update(
            bulk_update_issues,
            [
                "priority",
                "start_date",
                "target_date",
                "state",
            ],
            batch_size=100,
        )

        # Create new labels
        IssueLabel.objects.bulk_create(
            bulk_update_issue_labels,
            ignore_conflicts=True,
            batch_size=100,
        )

        # Create new assignees
        IssueAssignee.objects.bulk_create(
            bulk_update_issue_assignees,
            ignore_conflicts=True,
            batch_size=100,
        )
        # update the issue activity
        [
            issue_activity.delay(**activity)
            for activity in bulk_issue_activities
        ]

        return Response(status=status.HTTP_204_NO_CONTENT)
