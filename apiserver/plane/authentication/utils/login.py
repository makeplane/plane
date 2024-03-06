from django.contrib.auth import login


def user_login(request, user):
    login(request=request, user=user)
    device_info = {
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "ip_address": request.META.get("REMOTE_ADDR", ""),
    }
    request.session["device_info"] = device_info
    request.session.save()
    return
