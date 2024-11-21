# Django imports
from django.contrib.auth import login
from django.conf import settings

# Module imports
from plane.authentication.utils.host import base_host


def user_login(request, user, is_app=False, is_admin=False, is_space=False):
    login(request=request, user=user)

    # If is admin cookie set the custom age
    if is_admin:
        request.session.set_expiry(settings.ADMIN_SESSION_COOKIE_AGE)

    device_info = {
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "ip_address": request.META.get("REMOTE_ADDR", ""),
        "domain": base_host(
            request=request, is_app=is_app, is_admin=is_admin, is_space=is_space
        ),
    }
    request.session["device_info"] = device_info
    request.session.save()
    return
