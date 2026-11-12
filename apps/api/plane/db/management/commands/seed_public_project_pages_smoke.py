# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.core.management.base import BaseCommand

from plane.db.models import APIToken, Project, ProjectMember, User, Workspace, WorkspaceMember


class Command(BaseCommand):
    help = "Seed disposable data for the public project Pages HTTP smoke test."

    def add_arguments(self, parser):
        parser.add_argument("--api-key", required=True)

    def handle(self, *args, **options):
        user, _ = User.objects.get_or_create(
            email="smoke-pages@plane.local",
            defaults={"first_name": "Smoke", "last_name": "Pages"},
        )
        workspace, _ = Workspace.objects.get_or_create(
            slug="smoke-pages-workspace",
            defaults={"name": "Smoke Pages Workspace", "owner": user},
        )
        WorkspaceMember.objects.get_or_create(workspace=workspace, member=user, defaults={"role": 20})
        project, _ = Project.objects.get_or_create(
            workspace=workspace,
            identifier="SMOKE",
            defaults={"name": "Smoke Project Pages", "created_by": user},
        )
        ProjectMember.objects.get_or_create(
            workspace=workspace, project=project, member=user, defaults={"role": 20, "is_active": True}
        )
        APIToken.objects.update_or_create(
            token=options["api_key"], defaults={"user": user, "label": "Smoke Pages API token", "is_active": True}
        )
        self.stdout.write("Smoke Pages seed ready")
