# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Mint an authenticated session for a user and print the `session-id` cookie
value. Used by the Help Center screenshot tool to drive Playwright as a logged-in
user without going through the (SSO-only) login form.

    python manage.py make_help_session            # default screenshot user
    python manage.py make_help_session --email a@b.c
"""

from importlib import import_module

from django.conf import settings
from django.core.management.base import BaseCommand

from plane.db.models import User

DEFAULT_EMAIL = "help-screenshot@shinhan.local"


class Command(BaseCommand):
    help = "Print a session-id cookie value for an authenticated session (screenshot automation)."

    def add_arguments(self, parser):
        parser.add_argument("--email", default=DEFAULT_EMAIL, help="User email to authenticate as.")

    def handle(self, *args, **options):
        user = User.objects.get(email=options["email"])
        engine = import_module(settings.SESSION_ENGINE)
        session = engine.SessionStore()
        # Mirror django.contrib.auth.login(): the auth middleware verifies all three.
        session["_auth_user_id"] = str(user.id)
        session["_auth_user_backend"] = "django.contrib.auth.backends.ModelBackend"
        session["_auth_user_hash"] = user.get_session_auth_hash()
        session.create()
        # Print ONLY the key on its own line so callers can capture it cleanly.
        self.stdout.write(session.session_key)
