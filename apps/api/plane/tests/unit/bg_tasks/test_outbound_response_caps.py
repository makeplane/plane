# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Outbound fetches read the response body as a stream and stop at a size cap.

Covers the work item link crawl (page title and favicon) and webhook delivery
(the response body stored in the webhook log).
"""

import base64
from unittest.mock import patch

import pytest

from plane.bgtasks import webhook_task, work_item_link_task
from plane.bgtasks.webhook_task import MAX_WEBHOOK_RESPONSE_BYTES, webhook_send_task
from plane.bgtasks.work_item_link_task import (
    DEFAULT_FAVICON,
    MAX_FAVICON_BYTES,
    MAX_TITLE_HTML_BYTES,
    crawl_work_item_link_title_and_favicon,
)
from plane.db.models import Webhook, WebhookLog
from plane.utils.url_security import read_capped_body

PAGE_URL = "https://example.com/page"
DEFAULT_FAVICON_URI = f"data:image/svg+xml;base64,{DEFAULT_FAVICON}"


class FakeResponse:
    """A streamed response that records how much of its body was read."""

    def __init__(self, body, headers=None):
        self.body = body
        self.headers = headers or {}
        self.status_code = 200
        self.bytes_read = 0
        self.closed = False

    def iter_content(self, chunk_size):
        for start in range(0, len(self.body), chunk_size):
            chunk = self.body[start : start + chunk_size]
            self.bytes_read += len(chunk)
            yield chunk

    @property
    def content(self):
        # Reading the body without streaming loads all of it
        self.bytes_read = len(self.body)
        return self.body

    @property
    def text(self):
        return self.content.decode()

    def close(self):
        self.closed = True


def _crawl(page, favicon):
    """Crawl PAGE_URL with the page and favicon fetches answered by the given responses."""
    with (
        patch.object(work_item_link_task, "safe_get", side_effect=[(page, PAGE_URL), (favicon, PAGE_URL)]),
        patch.object(work_item_link_task, "validate_url_ip"),
    ):
        return crawl_work_item_link_title_and_favicon(PAGE_URL)


def _page(padding=b""):
    return FakeResponse(b'<html><head><title>Docs</title><link rel="icon" href="/icon.png"></head>' + padding)


@pytest.mark.unit
class TestWorkItemLinkCrawlCaps:
    def test_normal_page_and_favicon_are_used_in_full(self):
        favicon = FakeResponse(b"icon-bytes", headers={"content-type": "image/png"})

        result = _crawl(_page(), favicon)

        assert result["title"] == "Docs"
        assert result["favicon"] == f"data:image/png;base64,{base64.b64encode(b'icon-bytes').decode()}"

    def test_oversized_page_is_not_read_in_full_and_still_yields_the_title(self):
        page = _page(padding=b" " * (MAX_TITLE_HTML_BYTES * 3))

        result = _crawl(page, FakeResponse(b"icon-bytes"))

        assert result["title"] == "Docs"
        assert page.bytes_read < len(page.body)
        assert page.closed

    def test_oversized_favicon_falls_back_to_the_default(self):
        favicon = FakeResponse(b"x" * (MAX_FAVICON_BYTES * 3), headers={"content-type": "image/png"})

        result = _crawl(_page(), favicon)

        assert result["favicon"] == DEFAULT_FAVICON_URI
        assert favicon.bytes_read < len(favicon.body)
        assert favicon.closed


@pytest.mark.unit
@pytest.mark.django_db
class TestWebhookResponseBodyCap:
    def _deliver(self, workspace, response):
        webhook = Webhook.objects.create(workspace=workspace, url="https://example.com/hook")
        with patch.object(webhook_task, "pinned_fetch", return_value=response) as fetch:
            webhook_send_task(
                webhook_id=str(webhook.id),
                slug=workspace.slug,
                event="issue",
                event_data={"id": "1"},
                action="POST",
                current_site="https://plane.example.com",
                activity=None,
            )
        assert fetch.call_args.kwargs["stream"] is True
        return WebhookLog.objects.get(webhook=webhook.id)

    def test_normal_response_body_is_stored_in_full(self, workspace):
        log = self._deliver(workspace, FakeResponse(b'{"ok": true}'))

        assert log.response_status == "200"
        assert log.response_body == '{"ok": true}'

    def test_oversized_response_body_is_truncated(self, workspace):
        response = FakeResponse(b"x" * (MAX_WEBHOOK_RESPONSE_BYTES * 10))

        log = self._deliver(workspace, response)

        assert log.response_status == "200"
        assert log.response_body.startswith("x" * MAX_WEBHOOK_RESPONSE_BYTES)
        assert len(log.response_body) < MAX_WEBHOOK_RESPONSE_BYTES + 100
        assert response.bytes_read < len(response.body)
        assert response.closed


@pytest.mark.unit
class TestReadCappedBody:
    def test_stops_reading_once_the_time_limit_passes(self):
        response = FakeResponse(b"x" * 100_000)

        # The clock is read once to set the deadline, then after each chunk
        with patch("plane.utils.url_security.time.monotonic", side_effect=[0, 5, 11]):
            content, truncated = read_capped_body(response, max_bytes=1_000_000, max_seconds=10)

        assert truncated is True
        assert len(content) == response.bytes_read < len(response.body)
        assert response.closed
