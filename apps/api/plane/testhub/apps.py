# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class TesthubConfig(AppConfig):
    name = "plane.testhub"
    label = "testhub"
    verbose_name = "Testhub"

    def ready(self) -> None:
        from plane.testhub import bgtasks  # noqa: F401
