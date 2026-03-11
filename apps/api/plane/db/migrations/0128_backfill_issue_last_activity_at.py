# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import os

from django.db import migrations


def trigger_backfill_task(apps, schema_editor):
    """Trigger the backfill as a Celery background task instead of running inline.
    Skipped when IS_MANAGED=0 (cloud), where the backfill is run manually.
    """
    if os.environ.get("IS_MANAGED", "1") == "0":
        return

    from plane.bgtasks.backfill_issue_last_activity_at_task import (
        backfill_issue_last_activity_at,
    )

    backfill_issue_last_activity_at.delay()


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0127_issue_last_activity_at"),
    ]

    operations = [
        migrations.RunPython(trigger_backfill_task, migrations.RunPython.noop),
    ]