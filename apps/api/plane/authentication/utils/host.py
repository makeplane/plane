# Django imports
from django.conf import settings
from django.http import HttpRequest

# Third party imports
from rest_framework.request import Request

# Module imports
from plane.utils.ip_address import get_client_ip


def base_host(
    request: Request | HttpRequest,
    is_admin: bool = False,
    is_space: bool = False,
    is_app: bool = False,
) -> str:
    """Utility function to return host / origin from the request"""
    # Prefer the HTTP_ORIGIN header if present, since it reflects the exact client origin
    client_origin = request.META.get("HTTP_ORIGIN") or request.META.get("HTTP_REFERER")
    if client_origin:
        from urllib.parse import urlparse
        parsed = urlparse(client_origin)
        if parsed.scheme and parsed.netloc:
            client_origin = f"{parsed.scheme}://{parsed.netloc}"
            
            # Security Fix: Prevent Open Redirect Vulnerabilities
            # Ensure the provided origin is within our trusted hosts before using it
            is_allowed = False
            normalized_origin = client_origin.lower()
            
            allowed_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
            if normalized_origin in [o.lower() for o in allowed_origins]:
                is_allowed = True
                
            if not is_allowed:
                for base in [settings.WEB_URL, settings.APP_BASE_URL, settings.ADMIN_BASE_URL, settings.SPACE_BASE_URL]:
                    if base and normalized_origin == base.rstrip('/').lower():
                        is_allowed = True
                        break
                        
            if not is_allowed:
                client_origin = None
        else:
            client_origin = None

    # Calculate the base origin from request
    base_origin = client_origin or settings.WEB_URL or settings.APP_BASE_URL

    # Admin redirection
    if is_admin:
        admin_base_path = getattr(settings, "ADMIN_BASE_PATH", None)
        if not isinstance(admin_base_path, str):
            admin_base_path = "/god-mode/"
        if not admin_base_path.startswith("/"):
            admin_base_path = "/" + admin_base_path
        if not admin_base_path.endswith("/"):
            admin_base_path += "/"

        if client_origin:
            return client_origin + admin_base_path
        elif settings.ADMIN_BASE_URL:
            return settings.ADMIN_BASE_URL + admin_base_path
        else:
            return base_origin + admin_base_path

    # Space redirection
    if is_space:
        space_base_path = getattr(settings, "SPACE_BASE_PATH", None)
        if not isinstance(space_base_path, str):
            space_base_path = "/spaces/"
        if not space_base_path.startswith("/"):
            space_base_path = "/" + space_base_path
        if not space_base_path.endswith("/"):
            space_base_path += "/"

        if client_origin:
            return client_origin + space_base_path
        elif settings.SPACE_BASE_URL:
            return settings.SPACE_BASE_URL + space_base_path
        else:
            return base_origin + space_base_path

    # App Redirection
    if is_app:
        if client_origin:
            return client_origin
        elif settings.APP_BASE_URL:
            return settings.APP_BASE_URL
        else:
            return base_origin

    return base_origin


def user_ip(request: Request | HttpRequest) -> str:
    return get_client_ip(request=request)
