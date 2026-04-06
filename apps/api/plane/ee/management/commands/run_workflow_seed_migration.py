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
from django.core.management.base import BaseCommand

# Module imports
from plane.ee.bgtasks.seed_workflow_projects_task import seed_workflow_default_states


class Command(BaseCommand):
    help = "Run the workflow state seeding migration as a standalone command. This is useful for self-managed instances where background task processing may not be set up."  # noqa: E501

    def handle(self, *args, **kwargs):
        try:
            # ask user if synchronous or asynchronous execution is preferred
            execution_mode = input("Do you want to run the seeding synchronously? (yes/no): ").strip().lower()
            if execution_mode == "yes":
                seed_workflow_default_states()
            else:
                seed_workflow_default_states.delay()

            self.stdout.write(self.style.SUCCESS("Successfully seeded workflow states"))
        except Exception as ex:
            self.stdout.write(self.style.ERROR(f"An error occurred while seeding workflow states: {ex}"))