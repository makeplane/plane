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

    def _is_admin_path(self, request):
        return "instances" in request.path

    def _is_coach_path(self, request):
        return request.path.startswith("/auth/coach/")

    def _get_cookie_name(self, request):
        if self._is_admin_path(request):
            return settings.ADMIN_SESSION_COOKIE_NAME

        if request.COOKIES.get(settings.SESSION_COOKIE_NAME):
            return settings.SESSION_COOKIE_NAME

        if request.COOKIES.get(settings.COACH_SESSION_COOKIE_NAME) or self._is_coach_path(request):
            return settings.COACH_SESSION_COOKIE_NAME

        return settings.SESSION_COOKIE_NAME

    def _get_cookie_age(self, request):
        cookie_name = getattr(request, "_session_cookie_name", self._get_cookie_name(request))

        if cookie_name == settings.ADMIN_SESSION_COOKIE_NAME:
            return settings.ADMIN_SESSION_COOKIE_AGE

        if cookie_name == settings.COACH_SESSION_COOKIE_NAME:
            return settings.COACH_SESSION_COOKIE_AGE

        return request.session.get_expiry_age()

    def process_request(self, request):
        cookie_name = self._get_cookie_name(request)
        session_key = request.COOKIES.get(cookie_name)
        request._session_cookie_name = cookie_name
        request.session = self.SessionStore(session_key)

    def process_response(self, request, response):
        """
        If request.session was modified, or if the configuration is to save the
        session every time, save the changes and set a session cookie or delete
        the session cookie if the session has been emptied.
        """
        try:
            accessed = request.session.accessed
            modified = request.session.modified
            empty = request.session.is_empty()
        except AttributeError:
            return response
        # First check if we need to delete this cookie.
        # The session should be deleted only if the session is entirely empty.
        cookie_name = getattr(request, "_session_cookie_name", self._get_cookie_name(request))

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
                    max_age = self._get_cookie_age(request)
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
