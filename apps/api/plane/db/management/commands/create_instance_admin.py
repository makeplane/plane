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
import logging

# Django imports
from django.core.management.base import BaseCommand, CommandError

# Module imports
from plane.license.models import Instance, InstanceAdmin
from plane.db.models import User


logger = logging.getLogger("plane.api")


class Command(BaseCommand):
    help = "Add a new instance admin"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("admin_email", type=str, help="Instance Admin Email")

    def handle(self, *args, **options):
        admin_email = options.get("admin_email", False)

        if not admin_email:
            raise CommandError("Please provide the email of the admin.")

        user = User.objects.filter(email=admin_email).first()
        logger.info(f"Creating instance admin with email {admin_email}")
        if user is None:
            raise CommandError("User with the provided email does not exist.")

        try:
            # Get the instance
            instance = Instance.objects.first()
            logger.info(f"Creating instance admin for user {user.email} on instance {instance.id}")

            # check if the the current user
            instance_admin = InstanceAdmin.objects.filter(instance=instance, user=user).first()
            if instance_admin:
                raise CommandError("The provided email is already an instance admin.")
            
            _ = InstanceAdmin.objects.create(instance=instance, user=user)
            self.stdout.write(self.style.SUCCESS("Successfully created the admin"))
        except Exception as e:
            logger.error(f"Error creating instance admin for user {user.email}: {str(e)}")
            raise CommandError("Failed to create the instance admin.")
