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

# Django imports
from django.core.management import BaseCommand

# Module imports
from plane.bgtasks.backfill_issue_last_activity_at_task import (
    backfill_issue_last_activity_at,
)


class Command(BaseCommand):
    help = "Trigger backfill of last_activity_at for issues where it is null"

    def handle(self, *args, **options):
        backfill_issue_last_activity_at.delay()
        self.stdout.write(self.style.SUCCESS("Successfully triggered backfill_issue_last_activity_at task"))
