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
from plane.ee.bgtasks.seed_default_collections_task import seed_default_collections


class Command(BaseCommand):
    help = "Seed default Collections for every workspace and link public global pages into them."

    def handle(self, *args, **kwargs):
        try:
            seed_default_collections()
            self.stdout.write(self.style.SUCCESS("Successfully seeded default collections"))
        except Exception as ex:
            self.stdout.write(self.style.ERROR(f"An error occurred while seeding default collections: {ex}"))
