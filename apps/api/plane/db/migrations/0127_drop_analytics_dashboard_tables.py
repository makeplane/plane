# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations


class Migration(migrations.Migration):
    """Drop V1 AnalyticsDashboard tables. V2 uses Dashboard/DashboardWidget instead.
    Migration 0120 is kept for history; this migration removes the actual tables.
    """

    dependencies = [
        ("db", "0126_dashboard_dashboardwidget_and_more"),
    ]

    operations = [
        # Delete Widget first — has FK to Dashboard
        migrations.DeleteModel(name="AnalyticsDashboardWidget"),
        migrations.DeleteModel(name="AnalyticsDashboard"),
    ]
