# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Import a Help Center bundle (from ``export_help_center``) into this instance.

Upserts categories + articles + translations by slug, uploads the bundled images
into THIS environment's object storage, and rewrites the inline image references
to the freshly-minted asset ids — so a guide reviewed in UAT lands fully wired in
production with no re-typing and no broken images. (The God Mode UI offers the
same, accepting a zipped bundle.)

Semantics live in ``plane.db.fixtures.help_center.transfer.apply_bundle``:
  * Additive upsert by slug — never deletes guide content the target already has;
    a slug soft-deleted in God Mode is revived.
  * Images are uploaded fresh and references rewritten; previously-referenced
    assets fall out of the HTML (harmless orphans). Re-importing never breaks
    images but can leave orphaned objects — clean those up at the storage layer.

    python manage.py import_help_center --in help_center_export
"""

import json
import os

from django.core.management.base import BaseCommand

from plane.db.fixtures.help_center.transfer import apply_bundle

DEFAULT_IN = "help_center_export"


class Command(BaseCommand):
    help = "Import a Help Center bundle produced by export_help_center (content + images)."

    def add_arguments(self, parser):
        parser.add_argument("--in", dest="in_dir", default=DEFAULT_IN, help="Bundle directory to import.")

    def handle(self, *args, **options):
        in_dir = options["in_dir"]
        manifest_path = os.path.join(in_dir, "manifest.json")
        if not os.path.isfile(manifest_path):
            self.stderr.write(self.style.ERROR(f"manifest.json not found in '{in_dir}'."))
            return
        with open(manifest_path, encoding="utf-8") as handle:
            manifest = json.load(handle)

        assets_dir = os.path.join(in_dir, "assets")

        def get_asset_bytes(safe_name):
            # safe_name is already a validated basename (see transfer.safe_basename),
            # so it cannot escape the bundle's assets directory.
            path = os.path.join(assets_dir, safe_name)
            if not os.path.isfile(path):
                return None
            with open(path, "rb") as handle:
                return handle.read()

        stats = apply_bundle(manifest, get_asset_bytes)

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {stats['categories']} categories, {stats['articles']} articles, "
                f"{stats['images']} images into this instance."
            )
        )
