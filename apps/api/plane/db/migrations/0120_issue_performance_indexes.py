"""Add performance indexes for issue listing queries.

These composite indexes cover the most common query patterns:
- Listing issues per project (filtered by soft delete)
- Sorting by created_at, updated_at, priority
- Filtering by state within a project
- Assignee and label lookups per issue
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0119_create_time_entry"),
    ]

    operations = [
        # Issue table - composite indexes for common list queries
        migrations.AddIndex(
            model_name="issue",
            index=models.Index(
                fields=["project", "-created_at"],
                name="issue_project_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="issue",
            index=models.Index(
                fields=["project", "-updated_at"],
                name="issue_project_updated_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="issue",
            index=models.Index(
                fields=["project", "state"],
                name="issue_project_state_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="issue",
            index=models.Index(
                fields=["project", "priority"],
                name="issue_project_priority_idx",
            ),
        ),
        # Soft delete filter - almost every query filters on deleted_at
        migrations.AddIndex(
            model_name="issue",
            index=models.Index(
                fields=["project", "deleted_at"],
                name="issue_project_deleted_idx",
            ),
        ),
        # IssueAssignee - used in N+1 serializer queries
        migrations.AddIndex(
            model_name="issueassignee",
            index=models.Index(
                fields=["issue", "assignee"],
                name="issueassignee_issue_user_idx",
            ),
        ),
        # IssueLabel - used in N+1 serializer queries
        migrations.AddIndex(
            model_name="issuelabel",
            index=models.Index(
                fields=["issue", "label"],
                name="issuelabel_issue_label_idx",
            ),
        ),
        # CycleIssue - used in subquery annotation on every list request
        migrations.AddIndex(
            model_name="cycleissue",
            index=models.Index(
                fields=["issue", "deleted_at"],
                name="cycleissue_issue_deleted_idx",
            ),
        ),
        # IssueLink - used in link_count subquery annotation
        migrations.AddIndex(
            model_name="issuelink",
            index=models.Index(
                fields=["issue"],
                name="issuelink_issue_idx",
            ),
        ),
    ]
