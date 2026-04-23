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

"""
Backfill baseline permissions required on every custom permission scheme.

Invariants enforced today:
- Every workspace-namespace PS must include ``workspace:view``.
- Every project-namespace PS must include ``project:view``.

Serializer validation now auto-injects these on create/update, but custom
schemes persisted before that change may lack them. This command walks all
active custom schemes and appends any missing baseline permissions.
"""

from django.core.management.base import BaseCommand, CommandError

from plane.db.models import Workspace
from plane.db.models.permission import PermissionScheme, RoleNamespace
from plane.permissions.cache import invalidate_caches_for_permission_scheme


BASELINE_PERMISSIONS_BY_NAMESPACE = {
    RoleNamespace.WORKSPACE: ("workspace:view",),
    RoleNamespace.PROJECT: ("project:view",),
}


class Command(BaseCommand):
    help = "Backfill baseline permissions required on every custom permission scheme"

    def add_arguments(self, parser):
        parser.add_argument(
            "--workspace",
            type=str,
            help="Only backfill schemes for this workspace slug",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing to the database",
        )

    def handle(self, *args, **options):
        workspace_slug = options.get("workspace")
        dry_run = options.get("dry_run", False)

        schemes = PermissionScheme.objects.filter(
            workspace__isnull=False,
            is_system=False,
            deleted_at__isnull=True,
            namespace__in=BASELINE_PERMISSIONS_BY_NAMESPACE.keys(),
        ).select_related("workspace")

        if workspace_slug:
            workspace = Workspace.objects.filter(slug=workspace_slug).first()
            if workspace is None:
                raise CommandError(f"Workspace with slug '{workspace_slug}' not found")
            schemes = schemes.filter(workspace=workspace)

        scanned = schemes.count()
        backfilled = 0
        already_complete = 0

        for scheme in schemes.iterator():
            required = BASELINE_PERMISSIONS_BY_NAMESPACE[scheme.namespace]
            current = list(scheme.permissions or [])
            missing = [perm for perm in required if perm not in current]

            if not missing:
                already_complete += 1
                continue

            self.stdout.write(
                f"  [{scheme.workspace.slug}] {scheme.namespace}/{scheme.slug} "
                f"— missing {', '.join(missing)}"
            )

            if dry_run:
                backfilled += 1
                continue

            scheme.permissions = current + missing
            scheme.save(update_fields=["permissions", "updated_at"])
            invalidate_caches_for_permission_scheme(scheme.id)
            backfilled += 1

        verb = "would backfill" if dry_run else "backfilled"
        self.stdout.write(
            self.style.SUCCESS(
                f"Scanned {scanned} custom scheme(s): {verb} {backfilled}, "
                f"already complete {already_complete}"
            )
        )
