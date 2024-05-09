# Python imports
from urllib.parse import urlsplit

# Django imports
from django.conf import settings


def base_host(request, is_admin=False, is_space=False):
    """Utility function to return host / origin from the request"""

    if is_admin and settings.ADMIN_BASE_URL:
        return settings.ADMIN_BASE_URL

    if is_space and settings.SPACE_BASE_URL:
        return settings.SPACE_BASE_URL

    return (
        request.META.get("HTTP_ORIGIN")
        or f"{urlsplit(request.META.get('HTTP_REFERER')).scheme}://{urlsplit(request.META.get('HTTP_REFERER')).netloc}"
        or f"""{"https" if request.is_secure() else "http"}://{request.get_host()}"""
    )


def user_ip(request):
    return str(request.META.get("REMOTE_ADDR"))
