# Generated manually for ISS-281939 performance fix
#
# Partial index to accelerate Phase 1 of WorkspaceViewIssuesViewSet.list().
#
# Phase 1 filters issues by workspace_id and sorts by created_at DESC with LIMIT 100.
# Without this index, Postgres scans all rows in the workspace and sorts them.
# With this index, Postgres walks the index in DESC order and stops at 100 entries —
# no heap sort, no full scan.
#
# Predicates mirror the filters applied on the issues table itself by IssueManager
# (deleted_at, archived_at, is_draft). The inbox/state/project-archive filters from
# IssueManager involve JOINs and cannot be expressed as partial index predicates.
#
# NOTE: atomic=False is required for CREATE INDEX CONCURRENTLY, which avoids locking
# the table during index creation on production.

from django.db import migrations


class Migration(migrations.Migration):

    atomic = False  # Required for CREATE INDEX CONCURRENTLY

    dependencies = [
        ("db", "0104_add_issue_hub_indexes"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE INDEX CONCURRENTLY idx_issues_workspace_list
                ON issues (workspace_id, created_at DESC)
                WHERE deleted_at IS NULL
                  AND archived_at IS NULL
                  AND is_draft = false;
            """,
            reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS idx_issues_workspace_list;",
        ),
    ]
