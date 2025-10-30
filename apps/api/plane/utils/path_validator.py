# Django imports
from django.utils.http import url_has_allowed_host_and_scheme
from django.conf import settings

# Python imports
from urllib.parse import urlparse


def _contains_suspicious_patterns(path: str) -> bool:
    """
    Check for suspicious patterns that might indicate malicious intent.

    Args:
        path (str): The path to check

    Returns:
        bool: True if suspicious patterns found, False otherwise
    """
    suspicious_patterns = [
        r"javascript:",  # JavaScript injection
        r"data:",  # Data URLs
        r"vbscript:",  # VBScript injection
        r"file:",  # File protocol
        r"ftp:",  # FTP protocol
        r"%2e%2e",  # URL encoded path traversal
        r"%2f%2f",  # URL encoded double slash
        r"%5c%5c",  # URL encoded backslashes
        r"<script",  # Script tags
        r"<iframe",  # Iframe tags
        r"<object",  # Object tags
        r"<embed",  # Embed tags
        r"<form",  # Form tags
        r"onload=",  # Event handlers
        r"onerror=",  # Event handlers
        r"onclick=",  # Event handlers
    ]

    path_lower = path.lower()
    for pattern in suspicious_patterns:
        if pattern in path_lower:
            return True

    return False


def get_allowed_hosts() -> list[str]:
    """Get the allowed hosts from the settings."""
    base_origin = settings.WEB_URL or settings.APP_BASE_URL

    allowed_hosts = []
    if base_origin:
        host = urlparse(base_origin).netloc
        allowed_hosts.append(host)
    if settings.ADMIN_BASE_URL:
        # Get only the host
        host = urlparse(settings.ADMIN_BASE_URL).netloc
        allowed_hosts.append(host)
    if settings.SPACE_BASE_URL:
        # Get only the host
        host = urlparse(settings.SPACE_BASE_URL).netloc
        allowed_hosts.append(host)
    return allowed_hosts


def validate_next_path(next_path: str) -> str:
    """Validates that next_path is a safe relative path for redirection."""
    # Browsers interpret backslashes as forward slashes. Remove all backslashes.
    if not next_path or not isinstance(next_path, str):
        return ""

    # Limit input length to prevent DoS attacks
    if len(next_path) > 500:
        return ""

    next_path = next_path.replace("\\", "")
    parsed_url = urlparse(next_path)

    # Block absolute URLs or anything with scheme/netloc
    if parsed_url.scheme or parsed_url.netloc:
        next_path = parsed_url.path  # Extract only the path component

    # Must start with a forward slash and not be empty
    if not next_path or not next_path.startswith("/"):
        return ""

    # Prevent path traversal
    if ".." in next_path:
        return ""

    # Additional security checks
    if _contains_suspicious_patterns(next_path):
        return ""

    return next_path


def get_safe_redirect_url(base_url: str, next_path: str = "", params: dict = {}) -> str:
    """
    Safely construct a redirect URL with validated next_path.

    Args:
        base_url (str): The base URL to redirect to
        next_path (str): The next path to append
        params (dict): The parameters to append
    Returns:
        str: The safe redirect URL
    """
    from urllib.parse import urlencode

    # Validate the next path
    validated_path = validate_next_path(next_path)

    # Add the next path to the parameters
    base_url = base_url.rstrip("/")

    # Prepare the query parameters
    query_parts = []
    encoded_params = ""

    # Add the next path to the parameters
    if validated_path:
        query_parts.append(f"next_path={validated_path}")

    # Add additional parameters
    if params:
        encoded_params = urlencode(params)
        query_parts.append(encoded_params)

    # Construct the url query string
    if query_parts:
        query_string = "&".join(query_parts)
        url = f"{base_url}/?{query_string}"
    else:
        url = base_url

    # Check if the URL is allowed
    if url_has_allowed_host_and_scheme(url, allowed_hosts=get_allowed_hosts()):
        return url

    # Return the base URL if the URL is not allowed
    return base_url + (f"?{encoded_params}" if encoded_params else "")
