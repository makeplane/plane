"""Add additional performance indexes for issue listing subqueries.

Covers subquery patterns not addressed by 0120:
- FileAsset attachment_count: filters on (issue_id, entity_type)
- Issue sub_issues_count: filters on (parent_id) through issue_objects manager (deleted_at)
- ModuleIssue module_ids: filters on (issue_id, deleted_at)
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0120_issue_performance_indexes"),
    ]

    operations = [
        # FileAsset - used in attachment_count subquery (no existing index covers issue + entity_type)
        migrations.AddIndex(
            model_name="fileasset",
            index=models.Index(
                fields=["issue", "entity_type"],
                name="fileasset_issue_entity_idx",
            ),
        ),
        # Issue parent - used in sub_issues_count subquery (FK index exists but not with deleted_at)
        migrations.AddIndex(
            model_name="issue",
            index=models.Index(
                fields=["parent", "deleted_at"],
                name="issue_parent_deleted_idx",
            ),
        ),
        # ModuleIssue - used in module_ids ArrayAgg subquery
        migrations.AddIndex(
            model_name="moduleissue",
            index=models.Index(
                fields=["issue", "deleted_at"],
                name="moduleissue_issue_deleted_idx",
            ),
        ),
    ]
