# Django imports
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpRequest

# Third party imports
from rest_framework.request import Request

# Module imports
from plane.utils.ip_address import get_client_ip

def base_host(request: Request | HttpRequest, is_admin: bool = False, is_space: bool = False, is_app: bool = False) -> str:
    """Utility function to return host / origin from the request"""
    # Calculate the base origin from request
    base_origin = settings.WEB_URL or settings.APP_BASE_URL

    if not base_origin:
        raise ImproperlyConfigured("APP_BASE_URL or WEB_URL is not set")

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


def user_ip(request: Request | HttpRequest) -> str:
    return get_client_ip(request=request)
