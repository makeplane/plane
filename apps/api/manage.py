#!/usr/bin/env python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os
import sys


def _apply_settings_argument(argv: list[str]) -> None:
    """Honor `--settings=...` before anything imports the `plane` package.

    Importing `plane.observability.setup` below runs `plane/__init__.py`, which
    imports `plane.celery`, which touches `django.conf.settings` at module
    scope. That materializes Django's LazySettings from DJANGO_SETTINGS_MODULE
    long before `execute_from_command_line` gets a chance to apply `--settings`,
    so the flag would be silently ignored (e.g. bin/docker-entrypoint-api-local.sh
    runs `runserver --settings=plane.settings.local`). Django itself does the
    same assignment, just later, so applying it here is equivalent.
    """
    for index, arg in enumerate(argv):
        if arg.startswith("--settings="):
            os.environ["DJANGO_SETTINGS_MODULE"] = arg.split("=", 1)[1]
            return
        if arg == "--settings" and index + 1 < len(argv):
            os.environ["DJANGO_SETTINGS_MODULE"] = argv[index + 1]
            return


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")
    _apply_settings_argument(sys.argv[1:])

    # Bootstrap OpenTelemetry before Django imports so runserver and
    # management commands are instrumented too. No-op unless OTel is active.
    from plane.observability.setup import configure_otel

    configure_otel()

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
