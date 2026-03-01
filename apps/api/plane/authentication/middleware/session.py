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

import time
from importlib import import_module

from django.conf import settings
from django.contrib.sessions.backends.base import UpdateError
from django.contrib.sessions.exceptions import SessionInterrupted
from django.utils.cache import patch_vary_headers
from django.utils.deprecation import MiddlewareMixin
from django.utils.http import http_date


class SessionMiddleware(MiddlewareMixin):
    def __init__(self, get_response):
        super().__init__(get_response)
        engine = import_module(settings.SESSION_ENGINE)
        self.SessionStore = engine.SessionStore

    def process_request(self, request):
        if "instances" in request.path:
            session_key = request.COOKIES.get(settings.ADMIN_SESSION_COOKIE_NAME)
        else:
            session_key = request.COOKIES.get(settings.SESSION_COOKIE_NAME)
        request.session = self.SessionStore(session_key)

    def _should_refresh_session(self, request, is_admin_path):
        """Check if the session expiry should be extended for an active user.

        To avoid a database write on every request, sessions are only
        refreshed once per day (86400 seconds). When refreshed, the
        expire_date is reset to a full SESSION_COOKIE_AGE from now,
        giving active users a rolling expiry window.
        """
        if is_admin_path:
            return False

        REFRESH_INTERVAL = 86400  # 1 day in seconds
        last_refreshed = request.session.get("_session_refreshed_at", 0)
        return time.time() - last_refreshed > REFRESH_INTERVAL

    def process_response(self, request, response):
        """
        If request.session was modified, or if the configuration is to save the
        session every time, save the changes and set a session cookie or delete
        the session cookie if the session has been emptied.
        """
        try:
            accessed = request.session.accessed
            empty = request.session.is_empty()
        except AttributeError:
            return response
        # First check if we need to delete this cookie.
        # The session should be deleted only if the session is entirely empty.
        is_admin_path = "instances" in request.path
        cookie_name = settings.ADMIN_SESSION_COOKIE_NAME if is_admin_path else settings.SESSION_COOKIE_NAME

        # Extend session expiry for active users. Instead of saving on
        # every request, refresh only once per day. Writing to the session
        # marks it as modified, so the existing save logic below handles
        # persisting the new expire_date and cookie.
        if accessed and not empty and self._should_refresh_session(request, is_admin_path):
            request.session["_session_refreshed_at"] = int(time.time())

        modified = request.session.modified

        if cookie_name in request.COOKIES and empty:
            response.delete_cookie(
                cookie_name,
                path=settings.SESSION_COOKIE_PATH,
                domain=settings.SESSION_COOKIE_DOMAIN,
                samesite=settings.SESSION_COOKIE_SAMESITE,
            )
            patch_vary_headers(response, ("Cookie",))
        else:
            if accessed:
                patch_vary_headers(response, ("Cookie",))
            if (modified or settings.SESSION_SAVE_EVERY_REQUEST) and not empty:
                if request.session.get_expire_at_browser_close():
                    max_age = None
                    expires = None
                else:
                    # Use different max_age based on whether it's an admin cookie
                    if is_admin_path:
                        max_age = settings.ADMIN_SESSION_COOKIE_AGE
                    else:
                        max_age = settings.SESSION_COOKIE_AGE

                    expires_time = time.time() + max_age
                    expires = http_date(expires_time)

                # Save the session data and refresh the client cookie.
                if response.status_code < 500:
                    try:
                        request.session.save()
                    except UpdateError:
                        raise SessionInterrupted(
                            "The request's session was deleted before the "
                            "request completed. The user may have logged "
                            "out in a concurrent request, for example."
                        )
                    response.set_cookie(
                        cookie_name,
                        request.session.session_key,
                        max_age=max_age,
                        expires=expires,
                        domain=settings.SESSION_COOKIE_DOMAIN,
                        path=settings.SESSION_COOKIE_PATH,
                        secure=settings.SESSION_COOKIE_SECURE or None,
                        httponly=settings.SESSION_COOKIE_HTTPONLY or None,
                        samesite=settings.SESSION_COOKIE_SAMESITE,
                    )
        return response
