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
from plane.bgtasks.transfer_email_notification_log_task import (
    schedule_transfer_email_notification_logs,
)


class Command(BaseCommand):
    help = "Transfer API logs from one database to another"

    def handle(self, *args, **options):
        batch_size = input("Enter the batch size: ")
        batch_countdown = input("Enter the batch countdown: ")

        # Trigger the member sync task with the workspace slug
        schedule_transfer_email_notification_logs.delay(
            batch_size=int(batch_size), batch_countdown=int(batch_countdown)
        )

        # Print the success message
        self.stdout.write(self.style.SUCCESS("Successfully triggered the transfer email notifications task"))
