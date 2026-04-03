# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import socket

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
    Resolves hostnames to IPs before checking.

    Args:
        url: The URL to validate

    Raises:
        ValueError: If the URL points to a private/internal IP
    """
    parsed = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        raise ValueError("Invalid URL: No hostname found")

    # Only allow HTTP and HTTPS to prevent file://, gopher://, etc.
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Only HTTP and HTTPS are allowed")

    # Resolve hostname to IP addresses — this catches domain names that
    # point to internal IPs (e.g. attacker.com -> 169.254.169.254)

    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise ValueError("Hostname could not be resolved")

    if not addr_info:
        raise ValueError("No IP addresses found for the hostname")

    # Check every resolved IP against blocked ranges to prevent SSRF
    for addr in addr_info:
        ip = ipaddress.ip_address(addr[4][0])
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            raise ValueError("Access to private/internal networks is not allowed")


MAX_REDIRECTS = 5


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
            # Manually follow redirects to validate each URL before requesting
            redirect_count = 0
            response = requests.get(final_url, headers=headers, timeout=1, allow_redirects=False)

            while response.is_redirect and redirect_count < MAX_REDIRECTS:
                redirect_url = response.headers.get("Location")
                if not redirect_url:
                    break
                # Resolve relative redirects against current URL
                final_url = urljoin(final_url, redirect_url)
                # Validate the redirect target BEFORE making the request
                validate_url_ip(final_url)
                redirect_count += 1
                response = requests.get(final_url, headers=headers, timeout=1, allow_redirects=False)

            if redirect_count >= MAX_REDIRECTS:
                logger.warning(f"Too many redirects for URL: {url}")

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
                favicon_href = urljoin(base_url, favicon_tag["href"])
                validate_url_ip(favicon_href)
                return favicon_href

    # Fallback to /favicon.ico
    parsed_url = urlparse(base_url)
    fallback_url = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"

    # Check if fallback exists
    try:
        validate_url_ip(fallback_url)
        response = requests.head(fallback_url, timeout=2, allow_redirects=False)

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

        validate_url_ip(favicon_url)

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
