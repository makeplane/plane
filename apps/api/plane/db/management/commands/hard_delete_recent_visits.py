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
from plane.bgtasks.hard_delete_user_recent_visit_task import (
    schedule_hard_delete_user_recent_visits,
)


class Command(BaseCommand):
    help = "Delete user recent visit logs"

    def handle(self, *args, **options):
        batch_size = input("Enter the batch size: ")
        batch_countdown = input("Enter the batch countdown: ")

        # Trigger the hard delete user recent visit task
        schedule_hard_delete_user_recent_visits.delay(batch_size=int(batch_size), batch_countdown=int(batch_countdown))

        # Print the success message
        self.stdout.write(self.style.SUCCESS("Successfully triggered the hard delete task"))
