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
from django.core.management import BaseCommand, CommandError
from django.db import IntegrityError

# Module imports
from plane.bgtasks.copy_workspace_data_task import copy_workspace_data
from plane.db.models import User, Workspace, WorkspaceMember


# Command to run the script
class Command(BaseCommand):
    help = "Move data from one workspace to another"

    def _create_workspace(self, owner, slug, name, source_workspace):
        try:
            workspace = Workspace.objects.create(
                owner=owner,
                slug=slug,
                name=name,
                organization_size=source_workspace.organization_size,
            )

            # add the user to workspace as admin
            WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)

        except IntegrityError:
            raise IntegrityError("Workspace already exists")

    def handle(self, *args, **options):
        try:
            source_workspace_slug = input("Enter source workspace slug: ")
            target_workspace_slug = input("Enter target workspace slug: ")
            target_workspace_name = input("Enter target workspace name: ")

            user_email = input("Enter user email to create a workspace owner: ")

            user = User.objects.filter(email=user_email).first()
            if not user:
                raise CommandError("User not found")

            source_workspace = Workspace.objects.filter(slug=source_workspace_slug).first()
            if not source_workspace:
                raise CommandError("Source workspace not found")

            # create the workspace and make him as owner
            self._create_workspace(user, target_workspace_slug, target_workspace_name, source_workspace)

            copy_workspace_data.delay(source_workspace_slug, target_workspace_slug)
            self.stdout.write(self.style.SUCCESS("Data copy initiated successfully"))
        except Exception as e:
            print(f"Error: {str(e)}")
