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

# Python imports
import os
import secrets
import uuid

# Django imports
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

# Module imports
from plane.license.models import Instance, InstanceAdmin, InstanceEdition
from plane.db.models import User, Profile


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def handle(self, *args, **options):
        admin_email = os.environ.get("INSTANCE_ADMIN_EMAIL", "").strip()

        if not admin_email:
            raise CommandError("INSTANCE_ADMIN_EMAIL environment variable is required")

        app_version = os.environ.get("APP_VERSION", "latest")

        user = User.objects.filter(email=admin_email).first()
        if user is None:
            user = User.objects.create(
                email=admin_email,
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
            )
            _ = Profile.objects.create(user=user)

        try:
            # Check if the instance is registered
            instance = Instance.objects.first()

            if instance is None:
                instance = Instance.objects.create(
                    instance_name="Plane Cloud US",
                    instance_id=secrets.token_hex(12),
                    current_version=app_version,
                    latest_version=app_version,
                    last_checked_at=timezone.now(),
                    is_verified=True,
                    is_setup_done=True,
                    is_signup_screen_visited=True,
                    edition=InstanceEdition.PLANE_CLOUD.value,
                )
                self.stdout.write(self.style.SUCCESS("Instance registered"))
            else:
                # Update the instance name and version
                instance.instance_name = "Plane Cloud US"
                instance.current_version = app_version
                instance.edition = InstanceEdition.PLANE_CLOUD.value
                instance.last_checked_at = timezone.now()
                instance.save(
                    update_fields=[
                        "instance_name",
                        "current_version",
                        "last_checked_at",
                        "edition",
                    ]
                )

                self.stdout.write(self.style.SUCCESS("Instance already registered"))

            # Get or create an instance admin
            _, created = InstanceAdmin.objects.get_or_create(
                user=user, instance=instance, defaults={"role": 20, "is_verified": True}
            )

            if not created:
                self.stdout.write(self.style.WARNING("given email is already an instance admin"))

            self.stdout.write(self.style.SUCCESS("Successful"))
        except Exception as e:
            print(e)
            raise CommandError("Failure")
