# Python imports
from urllib.parse import urlparse


def validate_next_path(next_path: str) -> str:
    """Validates that next_path is a safe relative path for redirection."""
    # Browsers interpret backslashes as forward slashes. Remove all backslashes.
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

    return next_path
