#!/usr/bin/env python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os
import sys


def _apply_django_default_options(argv: list[str]) -> None:
    """Apply `--settings` / `--pythonpath` before anything imports the `plane` package.

    Importing `plane.observability.setup` below runs `plane/__init__.py`, which
    imports `plane.celery`, which touches `django.conf.settings` at module
    scope. That loads the settings module long before `execute_from_command_line`
    would apply these options, so `--settings` would be ignored and a settings
    module on `--pythonpath` would fail to import. This is the same pre-parse
    Django's ManagementUtility.execute does (same parser, last occurrence wins);
    running it twice is what Django itself does.
    """
    from django.core.management.base import CommandError, CommandParser, handle_default_options

    parser = CommandParser(add_help=False, allow_abbrev=False)
    parser.add_argument("--settings")
    parser.add_argument("--pythonpath")
    parser.add_argument("args", nargs="*")
    try:
        options, _ = parser.parse_known_args(argv[2:])
        handle_default_options(options)
    except CommandError:
        pass  # Django ignores option errors at this point too.


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    _apply_django_default_options(sys.argv)

    # Bootstrap OpenTelemetry before Django sets up so runserver and
    # management commands are instrumented too. No-op unless OTel is active.
    from plane.observability.setup import configure_otel

    configure_otel()
    execute_from_command_line(sys.argv)
