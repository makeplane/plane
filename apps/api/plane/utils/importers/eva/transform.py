# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any

from bs4 import BeautifulSoup

from plane.utils.content_validator import validate_html_content

from .constants import EVA_PRIORITY_TO_PLANE, EVA_RELATION_TO_PLANE, EVA_STATUS_TO_STATE_GROUP


class EvaTransformer:
    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or "").rstrip("/")

    def resolve_media_url(self, src: str | None) -> str:
        if not src:
            return ""
        if src.startswith("http://") or src.startswith("https://"):
            return src
        if not self.base_url:
            return src
        if src.startswith("/"):
            return f"{self.base_url}{src}"
        return f"{self.base_url}/{src.lstrip('/')}"

    def rewrite_media_urls(self, html: str | None) -> str:
        if not html or "src=" not in html.lower():
            return html or ""
        if not self.base_url:
            return html

        def replace_src(match: re.Match[str]) -> str:
            quote = match.group(1)
            src = match.group(2)
            resolved = self.resolve_media_url(src)
            return f"src={quote}{resolved}{quote}"

        return re.sub(r'src=(["\'])(.*?)\1', replace_src, html, flags=re.IGNORECASE)

    def convert_eva_video_blocks(self, html: str | None) -> str:
        if not html:
            return ""
        if "wiki-video" not in html and 'data-macros="video"' not in html:
            return html

        soup = BeautifulSoup(html, "html.parser")
        containers = soup.select('div.wiki-video, div[data-macros="video"]')
        if not containers:
            return html

        for container in containers:
            source = container.find("source")
            video = container.find("video")
            src = (source.get("src") if source else None) or (video.get("src") if video else None)
            attach_id = container.get("data-attach-id")
            if not src:
                container.decompose()
                continue

            absolute_url = self.resolve_media_url(src)
            filename = absolute_url.rsplit("/", 1)[-1] or "video.mp4"
            paragraph = soup.new_tag("p")
            if attach_id:
                paragraph["data-eva-video"] = attach_id
            else:
                paragraph["data-eva-video"] = absolute_url

            link = soup.new_tag("a", href=absolute_url)
            link["target"] = "_blank"
            link["rel"] = "noopener noreferrer"
            link.string = f"Video: {filename}"
            paragraph.append(link)
            container.replace_with(paragraph)

        return str(soup)

    def sanitize_html(self, html: str | None) -> str:
        if not html:
            return "<p></p>"
        normalized = self.convert_eva_video_blocks(html)
        rewritten = self.rewrite_media_urls(normalized)
        _, _, sanitized = validate_html_content(rewritten)
        return sanitized if sanitized else "<p></p>"

    def map_priority(self, priority: int | None) -> str:
        if priority is None:
            return "none"
        return EVA_PRIORITY_TO_PLANE.get(priority, "none")

    def map_status_group(self, cache_status_type: str | None) -> str:
        if not cache_status_type:
            return "unstarted"
        return EVA_STATUS_TO_STATE_GROUP.get(cache_status_type, "unstarted")

    def map_relation_type(self, relation_type: str | None) -> str | None:
        if not relation_type:
            return "relates_to"
        return EVA_RELATION_TO_PLANE.get(relation_type, "relates_to")

    def parse_date(self, value: str | None) -> date | None:
        if not value:
            return None
        normalized = value.replace(" ", "T").replace("+3", "+03:00")
        try:
            return datetime.fromisoformat(normalized).date()
        except ValueError:
            match = re.match(r"(\d{4}-\d{2}-\d{2})", value)
            return date.fromisoformat(match.group(1)) if match else None

    def parse_datetime(self, value: str | None) -> datetime | None:
        if not value:
            return None
        normalized = value.replace(" ", "T").replace("+3", "+03:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None

    def collect_labels(self, task: dict[str, Any]) -> list[str]:
        labels: list[str] = []
        for tag in task.get("tags") or []:
            name = tag.get("name")
            if name:
                labels.append(name)
        request_type = task.get("request_type") or {}
        if request_type.get("name"):
            labels.append(request_type["name"])
        return labels

    def comment_html(self, comment: dict[str, Any], *, fallback_author: str | None = None) -> str:
        text = comment.get("text") or ""
        author = comment.get("cmf_author") or {}
        author_name = author.get("name") or author.get("login") or fallback_author
        created_at = comment.get("cmf_created_at")
        prefix = ""
        if author_name or created_at:
            prefix = f"<p><em>Imported from EVA"
            if author_name:
                prefix += f" by {author_name}"
            if created_at:
                prefix += f" at {created_at}"
            prefix += "</em></p>"
        return self.sanitize_html(f"{prefix}{text}")

    def issue_description_html(self, task: dict[str, Any]) -> str:
        description = task.get("text") or ""
        code = task.get("code")
        if code:
            description = f"<p><em>EVA ID: {code}</em></p>{description}"
        return self.sanitize_html(description)

    def document_description_html(self, document: dict[str, Any]) -> str:
        description = document.get("text") or ""
        code = document.get("code")
        if code:
            description = f"<p><em>EVA document: {code}</em></p>{description}"
        return self.sanitize_html(description)

    def testcase_description_html(self, testcase: dict[str, Any]) -> str:
        description = testcase.get("text") or ""
        code = testcase.get("code")
        if code:
            description = f"<p><em>EVA test case: {code}</em></p>{description}"
        return self.sanitize_html(description)

    def preview_users(self, extracted: dict[str, Any], eva_users: list[dict[str, Any]]) -> list[dict[str, Any]]:
        discovered: dict[str, dict[str, Any]] = {}
        for user in eva_users:
            email = user.get("login") or user.get("code")
            if email:
                discovered[email.lower()] = {
                    "eva_id": user.get("id"),
                    "username": user.get("name") or email,
                    "email": email,
                    "import": "map",
                }

        for task in extracted.get("tasks", []):
            for key in ("responsible", "cmf_author"):
                person = task.get(key) or {}
                email = person.get("login")
                if email:
                    discovered.setdefault(
                        email.lower(),
                        {
                            "eva_id": person.get("id"),
                            "username": person.get("name") or email,
                            "email": email,
                            "import": "map",
                        },
                    )

        for comment in extracted.get("comments", []):
            author = comment.get("cmf_author") or {}
            email = author.get("login")
            if email:
                discovered.setdefault(
                    email.lower(),
                    {
                        "eva_id": author.get("id"),
                        "username": author.get("name") or email,
                        "email": email,
                        "import": "map",
                    },
                )

        return list(discovered.values())
