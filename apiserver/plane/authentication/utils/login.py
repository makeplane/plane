# Django imports
from django.contrib.auth import login

# Module imports
from plane.authentication.utils.host import base_host


def user_login(request, user):
    login(request=request, user=user)
    device_info = {
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "ip_address": request.META.get("REMOTE_ADDR", ""),
        "domain": base_host(request=request),
    }
    request.session["device_info"] = device_info
    request.session.save()
    return
