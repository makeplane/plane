# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Export the instance's Help Center (content + images) to a portable bundle dir.

Each environment owns its Help Center independently: it is seeded ONCE, then the
business team edits it in God Mode (rows in the DB, images in this instance's
object storage). To promote a reviewed UAT guide to production, export it here,
copy the bundle across (scp / USB — it is just files), and run
``import_help_center`` on the target. (The God Mode UI offers the same as a zip.)

Bundle layout (a plain directory; tar it if you prefer a single file):

    <out>/manifest.json            categories + articles + per-locale translations
    <out>/assets/<asset_id>.<ext>  the image bytes pulled from object storage

The translations keep their HTML/JSON exactly as stored (image URLs still point at
THIS env's asset ids); ``import_help_center`` rewrites those ids to the target
env's freshly-uploaded assets. Asset ids are per-environment — only the bytes are
portable.

    python manage.py export_help_center --out help_center_export
"""

import json
import os

from django.core.management.base import BaseCommand

from plane.db.fixtures.help_center.transfer import build_bundle

DEFAULT_OUT = "help_center_export"


class Command(BaseCommand):
    help = "Export Help Center content + images to a portable bundle for another instance."

    def add_arguments(self, parser):
        parser.add_argument("--out", default=DEFAULT_OUT, help="Output directory for the bundle.")

    def handle(self, *args, **options):
        out_dir = options["out"]
        assets_dir = os.path.join(out_dir, "assets")
        os.makedirs(assets_dir, exist_ok=True)

        manifest, blobs, missing = build_bundle()
        for blob in blobs:
            with open(os.path.join(assets_dir, blob["file"]), "wb") as handle:
                handle.write(blob["data"])
        with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as handle:
            json.dump(manifest, handle, ensure_ascii=False, indent=1)

        self.stdout.write(
            self.style.SUCCESS(
                f"Exported {len(manifest['categories'])} categories, {len(manifest['articles'])} articles, "
                f"{len(blobs)} images to '{out_dir}/'."
            )
        )
        if missing > 0:
            self.stdout.write(
                self.style.WARNING(f"{missing} referenced image(s) had no stored object and were skipped.")
            )
