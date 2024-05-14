# Python imports
from urllib.parse import urlsplit

# Django imports
from django.conf import settings


def base_host(request, is_admin=False, is_space=False, is_app=False):
    """Utility function to return host / origin from the request"""
    # Calculate the base origin from request
    base_origin = str(
        request.META.get("HTTP_ORIGIN")
        or f"{urlsplit(request.META.get('HTTP_REFERER')).scheme}://{urlsplit(request.META.get('HTTP_REFERER')).netloc}"
        or f"""{"https" if request.is_secure() else "http"}://{request.get_host()}"""
    )

    # Admin redirections
    if is_admin:
        if settings.ADMIN_BASE_URL:
            return settings.ADMIN_BASE_URL
        else:
            return base_origin + "/god-mode/"

    # Space redirections
    if is_space:
        if settings.SPACE_BASE_URL:
            return settings.SPACE_BASE_URL
        else:
            return base_origin + "/spaces/"

    # App Redirection
    if is_app:
        if settings.APP_BASE_URL:
            return settings.APP_BASE_URL
        else:
            return base_origin

    return base_origin


def user_ip(request):
    return str(request.META.get("REMOTE_ADDR"))
