# Python imports
from urllib.parse import urlparse


def validate_next_path(next_path: str) -> str:
    """Validates that next_path is a valid path and extracts only the path component."""
    parsed_url = urlparse(next_path)

    # Ensure next_path is not an absolute URL
    if parsed_url.scheme or parsed_url.netloc:
        next_path = parsed_url.path  # Extract only the path component

    # Ensure it starts with a forward slash (indicating a valid relative path)
    if not next_path.startswith("/"):
        return ""

    # Ensure it does not contain dangerous path traversal sequences
    if ".." in next_path:
        return ""

    return next_path
