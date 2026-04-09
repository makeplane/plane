# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import base64
import logging
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse

# Third party imports
import requests
from bs4 import BeautifulSoup
from celery import shared_task

# Module imports
from plane.utils.exception_logger import log_exception
from plane.utils.ip_address import validate_url
from plane.utils.link_crawler import LinkCrawlerEntity, LinkCrawlerInput

logger = logging.getLogger("plane.worker")

DEFAULT_FAVICON = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxpbmstaWNvbiBsdWNpZGUtbGluayI+PHBhdGggZD0iTTEwIDEzYTUgNSAwIDAgMCA3LjU0LjU0bDMtM2E1IDUgMCAwIDAtNy4wNy03LjA3bC0xLjcyIDEuNzEiLz48cGF0aCBkPSJNMTQgMTFhNSA1IDAgMCAwLTcuNTQtLjU0bC0zIDNhNSA1IDAgMCAwIDcuMDcgNy4wN2wxLjcxLTEuNzEiLz48L3N2Zz4="  # noqa: E501

MAX_REDIRECTS = 5


def safe_get(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 1,
) -> Tuple[requests.Response, str]:
    """
    Perform a GET request that validates every redirect hop against private IPs.
    Prevents SSRF by ensuring no redirect lands on a private/internal address.

    Args:
        url: The URL to fetch
        headers: Optional request headers
        timeout: Request timeout in seconds

    Returns:
        A tuple of (final Response object, final URL after redirects)

    Raises:
        ValueError: If any URL in the redirect chain points to a private IP
        requests.RequestException: On network errors
        RuntimeError: If max redirects exceeded
    """
    validate_url(url)

    current_url = url
    response = requests.get(
        current_url, headers=headers, timeout=timeout, allow_redirects=False
    )

    redirect_count = 0
    while response.is_redirect:
        if redirect_count >= MAX_REDIRECTS:
            raise RuntimeError(f"Too many redirects for URL: {url}")
        redirect_url = response.headers.get("Location")
        if not redirect_url:
            break
        current_url = urljoin(current_url, redirect_url)
        validate_url(current_url)
        redirect_count += 1
        response = requests.get(
            current_url, headers=headers, timeout=timeout, allow_redirects=False
        )

    return response, current_url


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
                try:
                    validate_url(favicon_href)
                except ValueError:
                    continue
                return favicon_href

    parsed_url = urlparse(base_url)
    fallback_url = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"

    try:
        validate_url(fallback_url)
        response = requests.head(fallback_url, timeout=2, allow_redirects=False)
        if response.status_code == 200:
            return fallback_url
    except (requests.RequestException, ValueError) as e:
        log_exception(e, warning=True)
        return None

    return None


def fetch_and_encode_favicon(
    headers: Dict[str, str], soup: Optional[BeautifulSoup], url: str
) -> Dict[str, Optional[str]]:
    """
    Fetch favicon and encode it as base64.

    Args:
        headers: Request headers
        soup: BeautifulSoup object
        url: Base URL for resolving relative paths

    Returns:
        dict: favicon_url and favicon_base64
    """
    try:
        favicon_url = find_favicon_url(soup, url)
        if favicon_url is None:
            return {
                "favicon_url": None,
                "favicon_base64": f"data:image/svg+xml;base64,{DEFAULT_FAVICON}",
            }

        response, _ = safe_get(favicon_url, headers=headers)

        content_type = response.headers.get("content-type", "image/x-icon")
        favicon_base64 = base64.b64encode(response.content).decode("utf-8")

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


def crawl_link_metadata(url: str) -> Dict[str, Any]:
    """
    Crawls a URL to extract the title and favicon.

    Args:
        url: The URL to crawl

    Returns:
        dict: title, favicon (base64), favicon_url, url, and optionally error
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"  # noqa: E501
        }

        soup = None
        title = None
        final_url = url

        try:
            response, final_url = safe_get(url, headers=headers)

            soup = BeautifulSoup(response.content, "html.parser")
            title_tag = soup.find("title")
            title = title_tag.get_text().strip() if title_tag else None

        except requests.RequestException as e:
            logger.warning(f"Failed to fetch HTML for title: {str(e)}")
        except ValueError as e:
            logger.warning(f"URL validation failed: {str(e)}")
        except RuntimeError as e:
            logger.warning(f"Redirect limit exceeded while fetching URL: {str(e)}")

        favicon_base64 = fetch_and_encode_favicon(headers, soup, final_url)

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


def _get_model_and_field(entity: LinkCrawlerEntity):
    """Returns (model_class, metadata_field_name) for the given entity type."""
    from plane.db.models import IssueLink, ModuleLink
    from plane.ee.models import Customer, InitiativeLink, ProjectLink

    ENTITY_CONFIG = {
        LinkCrawlerEntity.ISSUE: (IssueLink, "metadata"),
        LinkCrawlerEntity.MODULE: (ModuleLink, "metadata"),
        LinkCrawlerEntity.PROJECT: (ProjectLink, "metadata"),
        LinkCrawlerEntity.INITIATIVE: (InitiativeLink, "metadata"),
        LinkCrawlerEntity.CUSTOMER: (Customer, "logo_props"),
    }
    return ENTITY_CONFIG[entity]


@shared_task
def link_crawler(id: str, url: str, entity: str) -> None:
    """
    Common Celery task to crawl a URL and store metadata on the given entity.

    Args:
        id: Primary key of the model instance
        url: URL to crawl
        entity: Entity type (issue, module, project, initiative, customer)
    """
    validated = LinkCrawlerInput(id=id, url=url, entity=entity)

    model_class, field_name = _get_model_and_field(LinkCrawlerEntity(validated.entity))
    meta_data = crawl_link_metadata(validated.url)

    instance = model_class.objects.get(id=validated.id)
    setattr(instance, field_name, meta_data)
    instance.save(update_fields=[field_name])
