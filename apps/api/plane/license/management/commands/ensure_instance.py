# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
import os
import secrets
from pathlib import Path

from django.core.management.base import BaseCommand

from plane.license.models import Instance


class Command(BaseCommand):
    help = "Create or refresh the local instance record without external registration"

    def get_current_version(self) -> str:
        app_version = os.environ.get("APP_VERSION")
        if app_version:
            return app_version

        package_path = Path(__file__).resolve().parents[4] / "package.json"
        try:
            with package_path.open("r", encoding="utf-8") as package_file:
                return json.load(package_file).get("version", "0.0.0")
        except (OSError, ValueError):
            return "0.0.0"

    def handle(self, *args, **options):
        current_version = self.get_current_version()
        instance = Instance.objects.first()

        if instance is None:
            Instance.objects.create(
                instance_name=os.environ.get("INSTANCE_NAME", "AI4MS Research Workspace"),
                instance_id=secrets.token_hex(12),
                current_version=current_version,
            )
            self.stdout.write(self.style.SUCCESS("Local instance initialized"))
            return

        instance.current_version = current_version
        instance.save(update_fields=["current_version", "updated_at"])
        self.stdout.write(self.style.SUCCESS("Local instance refreshed"))
