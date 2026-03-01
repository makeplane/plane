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

from django.core.management import BaseCommand, call_command

VALID_EDITIONS = ("cloud", "commercial", "community")


class Command(BaseCommand):
    help = "Consolidated startup command that runs all initialization steps in a single Django process"

    def add_arguments(self, parser):
        parser.add_argument(
            "edition",
            type=str,
            choices=VALID_EDITIONS,
            help="Instance edition: cloud, commercial, or community",
        )
        parser.add_argument(
            "--machine-signature",
            type=str,
            default="",
            help="Machine signature for instance registration (community/commercial)",
        )

    def handle(self, *args, **options):
        edition = options["edition"]
        machine_signature = options["machine_signature"]

        self.stdout.write(f"Starting initialization for {edition} edition...")

        # Common pre-requisites — always run
        call_command("wait_for_db")
        call_command("wait_for_migrations")

        # Edition-specific steps
        if edition == "community":
            call_command("register_instance", machine_signature)
            call_command("configure_instance")
            call_command("create_bucket")
        elif edition == "commercial":
            call_command("register_instance_ee", machine_signature)
            call_command("configure_instance")
            call_command("create_bucket")
            call_command("update_licenses")
        elif edition == "cloud":
            call_command("setup_instance")

        # Collect static files
        call_command("collectstatic", "--noinput")

        # Clear cache after registration and configuration to remove stale values
        call_command("clear_cache")

        self.stdout.write(self.style.SUCCESS("Startup complete."))
