# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): one-time backfill that
# gives every project created before this feature shipped the same default custom
# fields new projects get automatically (see ProjectViewSet.create() in
# apps/api/plane/app/views/project/base.py; both call seed_default_custom_fields).
# Idempotent: safe to re-run, existing fields (matched by (project, name)) are left
# untouched.
#
# Usage: python manage.py seed_default_project_custom_fields

from django.core.management.base import BaseCommand
from django.db import transaction

from plane.db.default_data.project_custom_fields import seed_default_custom_fields
from plane.db.models import Project


class Command(BaseCommand):
    help = "Backfill every existing project with the default set of project custom fields."

    def handle(self, *args, **options):
        projects = Project.objects.all()
        total_fields_created = 0
        total_options_created = 0

        for project in projects:
            with transaction.atomic():
                fields_created, options_created = seed_default_custom_fields(project)
            total_fields_created += fields_created
            total_options_created += options_created

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {total_fields_created} custom field(s) and {total_options_created} "
                f"option(s) across {projects.count()} project(s)."
            )
        )
