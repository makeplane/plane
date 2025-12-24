# Python imports
import logging

# Third party imports
from celery import shared_task
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import base64
import ipaddress
from typing import Dict, Any
from typing import Optional
from plane.db.models import IssueLink
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")


DEFAULT_FAVICON = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxpbmstaWNvbiBsdWNpZGUtbGluayI+PHBhdGggZD0iTTEwIDEzYTUgNSAwIDAgMCA3LjU0LjU0bDMtM2E1IDUgMCAwIDAtNy4wNy03LjA3bC0xLjcyIDEuNzEiLz48cGF0aCBkPSJNMTQgMTFhNSA1IDAgMCAwLTcuNTQtLjU0bC0zIDNhNSA1IDAgMCAwIDcuMDcgNy4wN2wxLjcxLTEuNzEiLz48L3N2Zz4="  # noqa: E501


def validate_url_ip(url: str) -> None:
    """
    Validate that a URL doesn't point to a private/internal IP address.
    Only checks if the hostname is a direct IP address.

    Args:
        url: The URL to validate

    Raises:
        ValueError: If the URL points to a private/internal IP
    """
    parsed = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        return

    try:
        ip = ipaddress.ip_address(hostname)
    except ValueError:
        # Not an IP address (it's a domain name), nothing to check here
        return

    # It IS an IP address - check if it's private/internal
    if ip.is_private or ip.is_loopback or ip.is_reserved:
        raise ValueError("Access to private/internal networks is not allowed")


def crawl_work_item_link_title_and_favicon(url: str) -> Dict[str, Any]:
    """
    Crawls a URL to extract the title and favicon.

    Args:
        url (str): The URL to crawl

    Returns:
        str: JSON string containing title and base64-encoded favicon
    """
    try:
        # Set up headers to mimic a real browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"  # noqa: E501
        }

        soup = None
        title = None
        final_url = url

        validate_url_ip(final_url)

        try:
            response = requests.get(final_url, headers=headers, timeout=1)
            final_url = response.url  # Get the final URL after any redirects

            # check for redirected url also
            validate_url_ip(final_url)

            soup = BeautifulSoup(response.content, "html.parser")
            title_tag = soup.find("title")
            title = title_tag.get_text().strip() if title_tag else None

        except requests.RequestException as e:
            logger.warning(f"Failed to fetch HTML for title: {str(e)}")

        # Fetch and encode favicon using final URL (after redirects)
        favicon_base64 = fetch_and_encode_favicon(headers, soup, final_url)

        # Prepare result
        result = {
            "title": title,
            "favicon": favicon_base64["favicon_base64"],
            "url": url,
            "favicon_url": favicon_base64["favicon_url"],
        }

        return result

    except Exception as e:
        log_exception(e)
        return {
            "error": f"Unexpected error: {str(e)}",
            "title": None,
            "favicon": None,
            "url": url,
        }


def find_favicon_url(soup: Optional[BeautifulSoup], base_url: str) -> Optional[str]:
    """
    Find the favicon URL from HTML soup.

    Args:
        soup: BeautifulSoup object
        base_url: Base URL for resolving relative paths

    Returns:
        str: Absolute URL to favicon or None
    """

    if soup is not None:
        # Look for various favicon link tags
        favicon_selectors = [
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
            'link[rel="apple-touch-icon"]',
            'link[rel="apple-touch-icon-precomposed"]',
        ]

        for selector in favicon_selectors:
            favicon_tag = soup.select_one(selector)
            if favicon_tag and favicon_tag.get("href"):
                return urljoin(base_url, favicon_tag["href"])

    # Fallback to /favicon.ico
    parsed_url = urlparse(base_url)
    fallback_url = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"

    # Check if fallback exists
    try:
        response = requests.head(fallback_url, timeout=2)
        if response.status_code == 200:
            return fallback_url
    except requests.RequestException as e:
        log_exception(e, warning=True)
        return None

    return None


def fetch_and_encode_favicon(
    headers: Dict[str, str], soup: Optional[BeautifulSoup], url: str
) -> Dict[str, Optional[str]]:
    """
    Fetch favicon and encode it as base64.

    Args:
        favicon_url: URL to the favicon
        headers: Request headers

    Returns:
        str: Base64 encoded favicon with data URI prefix or None
    """
    try:
        favicon_url = find_favicon_url(soup, url)
        if favicon_url is None:
            return {
                "favicon_url": None,
                "favicon_base64": f"data:image/svg+xml;base64,{DEFAULT_FAVICON}",
            }

        response = requests.get(favicon_url, headers=headers, timeout=1)

        # Get content type
        content_type = response.headers.get("content-type", "image/x-icon")

        # Convert to base64
        favicon_base64 = base64.b64encode(response.content).decode("utf-8")

        # Return as data URI
        return {
            "favicon_url": favicon_url,
            "favicon_base64": f"data:{content_type};base64,{favicon_base64}",
        }

    except Exception as e:
        logger.warning(f"Failed to fetch favicon: {e}")
        return {
            "favicon_url": None,
            "favicon_base64": f"data:image/svg+xml;base64,{DEFAULT_FAVICON}",
        }


@shared_task
def crawl_work_item_link_title(id: str, url: str) -> None:
    meta_data = crawl_work_item_link_title_and_favicon(url)

    try:
        issue_link = IssueLink.objects.get(id=id)
    except IssueLink.DoesNotExist:
        logger.warning(f"IssueLink not found for the id {id} and the url {url}")
        return

    issue_link.metadata = meta_data
    issue_link.save()
