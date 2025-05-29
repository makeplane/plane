# Python imports
import re
from typing import Optional
from urllib.parse import urlparse, urlunparse


def is_valid_url(url: str) -> bool:
    """
    Validates whether the given string is a well-formed URL.

    Args:
        url (str): The URL string to validate.

    Returns:
        bool: True if the URL is valid, False otherwise.

    Example:
        >>> is_valid_url("https://example.com")
        True
        >>> is_valid_url("not a url")
        False
    """
    try:
        result = urlparse(url)
        # A valid URL should have at least scheme and netloc
        return all([result.scheme, result.netloc])
    except TypeError:
        return False


def get_url_components(url: str) -> Optional[dict]:
    """
    Parses the URL and returns its components if valid.

    Args:
        url (str): The URL string to parse.

    Returns:
        Optional[dict]: A dictionary with URL components if valid, None otherwise.

    Example:
        >>> get_url_components("https://example.com/path?query=1")
        {'scheme': 'https', 'netloc': 'example.com', 'path': '/path', 'params': '', 'query': 'query=1', 'fragment': ''}
    """
    if not is_valid_url(url):
        return None
    result = urlparse(url)
    return {
        "scheme": result.scheme,
        "netloc": result.netloc,
        "path": result.path,
        "params": result.params,
        "query": result.query,
        "fragment": result.fragment,
    }


def normalize_url_path(url: str) -> str:
    """
    Normalize the path component of a URL by replacing multiple consecutive slashes with a single slash.

    This function preserves the protocol, domain, query parameters, and fragments of the URL,
    only modifying the path portion to ensure there are no duplicate slashes.

    Args:
        url (str): The input URL string to normalize.

    Returns:
        str: The normalized URL with redundant slashes in the path removed.

    Example:
        >>> normalize_url_path('https://example.com//foo///bar//baz?x=1#frag')
        'https://example.com/foo/bar/baz?x=1#frag'
    """
    parts = urlparse(url)
    # Normalize the path
    normalized_path = re.sub(r"/+", "/", parts.path)
    # Reconstruct the URL
    return urlunparse(parts._replace(path=normalized_path))


def clean_value(value: str) -> str:
    """
    Clean the value by removing URLs and domain patterns.

    Args:
        value (str): The value to clean.

    Returns:
        str: The cleaned value.
    """

    if not value:
        return value

    url_pattern = r"(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"  # noqa

    # Remove URLs and domains
    cleaned_value = re.sub(url_pattern, "", value)

    # Keep only alphanumeric characters and spaces
    cleaned_value = re.sub(r"[^a-zA-Z0-9\s]", "", cleaned_value)

    # Remove extra spaces and trim
    cleaned_value = " ".join(cleaned_value.split())

    return cleaned_value
