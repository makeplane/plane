from urllib.parse import urlparse


def is_valid_http_url(url: str) -> bool:
    """Check if the given URL is a valid HTTPS URL."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ["https", "http"] and bool(parsed.netloc)
    except Exception:
        return False
