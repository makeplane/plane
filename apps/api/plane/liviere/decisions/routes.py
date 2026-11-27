# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The routes of the decision register, the same in both trees (app: /api/, API key: /api/v1/)."""

from django.urls import path

PREFIX = "workspaces/<str:slug>/projects/<uuid:project_id>/liviere/decisions/"
OPERATIONS = (
    "accept",
    "confirm",
    "defer",
    "resume",
    "done",
    "revoke",
    "review",
    "import-review",
    "supersede",
    "link",
    "ack",
)


def decision_patterns(views, name_suffix):
    """`views`: {"settings": view class, ...} of one tree; names end with `name_suffix` ("" or "-v1")."""
    routes = [
        ("settings/", "settings", ["get", "patch"], {}),
        ("", "list", ["get", "post"], {}),
        ("propose/", "propose", ["post"], {}),
        ("search/", "search", ["post"], {}),
        ("queues/", "queues", ["get"], {}),
        ("inbox/", "inbox", ["get"], {}),
        ("areas/", "areas", ["get", "post"], {}),
        ("areas/<int:area_id>/", "area", ["patch"], {}),
        ("import/", "import", ["post"], {}),
        ("<int:number>/", "detail", ["get", "patch"], {}),
    ]
    patterns = [
        path(
            PREFIX + route,
            views[key].as_view(http_method_names=methods),
            kwargs,
            name=f"liviere-decisions-{key}{name_suffix}",
        )
        for route, key, methods, kwargs in routes
    ]
    patterns += [
        path(
            PREFIX + f"<int:number>/{operation}/",
            views["action"].as_view(http_method_names=["post"]),
            {"operation": operation},
            name=f"liviere-decisions-{operation}{name_suffix}",
        )
        for operation in OPERATIONS
    ]
    return patterns
