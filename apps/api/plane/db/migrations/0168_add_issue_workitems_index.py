# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Partial index supporting cross-workspace work-item queries (Phase 1/6).
# Uses CREATE INDEX CONCURRENTLY to avoid table lock on production.
# atomic=False is required for CONCURRENTLY — Django wraps migrations in
# transactions by default which is incompatible with CONCURRENTLY.

from django.db import migrations


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("db", "0167_business_calendar_seed"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS issues_workitems_idx
                ON issues (target_date, state_id)
                WHERE parent_id IS NULL
                  AND deleted_at IS NULL
                  AND archived_at IS NULL
                  AND is_draft = FALSE;
            """,
            reverse_sql="DROP INDEX IF EXISTS issues_workitems_idx;",
        ),
    ]
