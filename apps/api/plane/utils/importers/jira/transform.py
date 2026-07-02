# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import html
import re
from datetime import datetime
from typing import Any

from plane.utils.content_validator import validate_html_content

from .constants import JIRA_PRIORITY_TO_PLANE, JIRA_STATUS_CATEGORY_TO_STATE_GROUP


class JiraTransformer:
    def __init__(self, *, custom_field_mappings: dict[str, str] | None = None):
        self.custom_field_mappings = custom_field_mappings or {}

    def map_priority(self, priority: dict[str, Any] | None) -> str:
        if not priority:
            return "none"
        name = (priority.get("name") or "").lower()
        return JIRA_PRIORITY_TO_PLANE.get(name, "none")

    def map_status_group(self, status: dict[str, Any] | None) -> str:
        if not status:
            return "unstarted"
        category = status.get("statusCategory") or {}
        key = (category.get("key") or category.get("name") or "").lower()
        return JIRA_STATUS_CATEGORY_TO_STATE_GROUP.get(key, "unstarted")

    def collect_labels(self, issue: dict[str, Any]) -> list[str]:
        fields = issue.get("fields") or {}
        labels: list[str] = []
        for label in fields.get("labels") or []:
            if label:
                labels.append(label)
        for component in fields.get("components") or []:
            name = component.get("name")
            if name:
                labels.append(name)
        return labels

    def adf_to_html(self, node: Any) -> str:
        if node is None:
            return ""
        if isinstance(node, str):
            return html.escape(node)
        if not isinstance(node, dict):
            return ""

        node_type = node.get("type")
        content = node.get("content") or []

        if node_type == "doc":
            return "".join(self.adf_to_html(child) for child in content)

        if node_type == "paragraph":
            inner = "".join(self.adf_to_html(child) for child in content)
            return f"<p>{inner or '<br>'}</p>"

        if node_type == "text":
            text = html.escape(node.get("text") or "")
            for mark in node.get("marks") or []:
                mark_type = mark.get("type")
                if mark_type == "strong":
                    text = f"<strong>{text}</strong>"
                elif mark_type == "em":
                    text = f"<em>{text}</em>"
                elif mark_type == "code":
                    text = f"<code>{text}</code>"
                elif mark_type == "link":
                    href = html.escape((mark.get("attrs") or {}).get("href") or "#")
                    text = f'<a href="{href}" target="_blank" rel="noopener noreferrer">{text}</a>'
            return text

        if node_type == "hardBreak":
            return "<br>"

        if node_type == "heading":
            level = (node.get("attrs") or {}).get("level") or 3
            level = min(max(int(level), 1), 6)
            inner = "".join(self.adf_to_html(child) for child in content)
            return f"<h{level}>{inner}</h{level}>"

        if node_type in {"bulletList", "orderedList"}:
            tag = "ul" if node_type == "bulletList" else "ol"
            items = "".join(self.adf_to_html(child) for child in content)
            return f"<{tag}>{items}</{tag}>"

        if node_type == "listItem":
            inner = "".join(self.adf_to_html(child) for child in content)
            return f"<li>{inner}</li>"

        if node_type == "blockquote":
            inner = "".join(self.adf_to_html(child) for child in content)
            return f"<blockquote>{inner}</blockquote>"

        if node_type == "rule":
            return "<hr>"

        if node_type == "table":
            rows = "".join(self.adf_to_html(child) for child in content)
            return f"<table>{rows}</table>"

        if node_type == "tableRow":
            cells = "".join(self.adf_to_html(child) for child in content)
            return f"<tr>{cells}</tr>"

        if node_type in {"tableHeader", "tableCell"}:
            tag = "th" if node_type == "tableHeader" else "td"
            inner = "".join(self.adf_to_html(child) for child in content)
            return f"<{tag}>{inner}</{tag}>"

        if node_type == "mediaSingle":
            return "".join(self.adf_to_html(child) for child in content)

        if node_type == "media":
            attrs = node.get("attrs") or {}
            alt = html.escape(attrs.get("alt") or "attachment")
            return f"<p><em>Attachment: {alt}</em></p>"

        if node_type == "panel":
            inner = "".join(self.adf_to_html(child) for child in content)
            return f"<div>{inner}</div>"

        return "".join(self.adf_to_html(child) for child in content)

    def field_value_to_html(self, value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, dict) and value.get("type") == "doc":
            return self.adf_to_html(value)
        if isinstance(value, dict) and "content" in value:
            return self.adf_to_html(value)
        if isinstance(value, str):
            if value.strip().startswith("<"):
                return value
            return f"<p>{html.escape(value)}</p>"
        if isinstance(value, list):
            parts = [self.field_value_to_html(item) for item in value]
            return "".join(part for part in parts if part)
        if isinstance(value, dict):
            rendered = value.get("value") or value.get("name") or value.get("displayName")
            if rendered:
                return f"<p>{html.escape(str(rendered))}</p>"
        return f"<p>{html.escape(str(value))}</p>"

    def _custom_field_sections(self, fields: dict[str, Any]) -> list[str]:
        sections: list[str] = []
        mapped_keys = set(self.custom_field_mappings.values())

        for label, field_key in self.custom_field_mappings.items():
            if field_key in fields and fields[field_key] is not None:
                rendered = self.field_value_to_html(fields[field_key])
                if rendered:
                    sections.append(f"<h3>{html.escape(label)}</h3>{rendered}")

        for field_key, value in fields.items():
            if not field_key.startswith("customfield_") or field_key in mapped_keys or value is None:
                continue
            rendered = self.field_value_to_html(value)
            if not rendered or rendered == "<p></p>":
                continue
            title = re.sub(r"([a-z])([A-Z])", r"\1 \2", field_key.replace("customfield_", "Field "))
            sections.append(f"<h3>{html.escape(title)}</h3>{rendered}")

        return sections

    def sanitize_html(self, html_content: str | None) -> str:
        if not html_content:
            return "<p></p>"
        _, _, sanitized = validate_html_content(html_content)
        return sanitized if sanitized else "<p></p>"

    def _test_steps_html(self, steps: list[dict[str, Any]]) -> str:
        if not steps:
            return ""

        items: list[str] = []
        for step in steps:
            parts: list[str] = []
            action = step.get("action") or step.get("text") or step.get("value")
            if action:
                if isinstance(action, dict):
                    parts.append(self.field_value_to_html(action))
                else:
                    parts.append(f"<p>{html.escape(str(action))}</p>")

            expected = step.get("expected") or step.get("expected_result")
            if expected:
                if isinstance(expected, dict):
                    expected_html = self.field_value_to_html(expected)
                else:
                    expected_html = f"<p>{html.escape(str(expected))}</p>"
                parts.append(f"<p><em>Expected</em></p>{expected_html}")

            if parts:
                items.append(f"<li>{''.join(parts)}</li>")

        if not items:
            return ""
        return f"<h3>Test steps</h3><ol>{''.join(items)}</ol>"

    def testcase_description_html(self, issue: dict[str, Any]) -> str:
        fields = issue.get("fields") or {}
        issue_key = issue.get("key") or ""
        parts: list[str] = []

        if issue_key:
            parts.append(f"<p><em>Jira test case: {html.escape(issue_key)}</em></p>")

        description = fields.get("description")
        if description is not None:
            parts.append(self.field_value_to_html(description))

        steps = issue.get("rtm_steps") or []
        if isinstance(steps, list) and steps:
            parts.append(self._test_steps_html(steps))

        parts.extend(self._custom_field_sections(fields))
        return self.sanitize_html("".join(parts))

    def comment_html(self, comment: dict[str, Any]) -> str:
        author = comment.get("author") or {}
        author_name = author.get("displayName") or author.get("emailAddress")
        created_at = comment.get("created")
        body = comment.get("body")

        prefix = ""
        if author_name or created_at:
            prefix = "<p><em>Imported from Jira"
            if author_name:
                prefix += f" by {html.escape(author_name)}"
            if created_at:
                prefix += f" at {html.escape(created_at)}"
            prefix += "</em></p>"

        body_html = self.field_value_to_html(body)
        return self.sanitize_html(f"{prefix}{body_html}")

    def parse_datetime(self, value: str | None) -> datetime | None:
        if not value:
            return None
        normalized = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None

    def preview_users(self, extracted: dict[str, Any]) -> list[dict[str, Any]]:
        discovered: dict[str, dict[str, Any]] = {}

        for issue in extracted.get("testcases", []):
            fields = issue.get("fields") or {}
            for person_key in ("assignee", "reporter"):
                person = fields.get(person_key) or {}
                email = person.get("emailAddress")
                if email:
                    discovered.setdefault(
                        email.lower(),
                        {
                            "jira_account_id": person.get("accountId"),
                            "username": person.get("displayName") or email,
                            "email": email,
                            "import": "map",
                        },
                    )

        for comment in extracted.get("comments", []):
            author = comment.get("author") or {}
            email = author.get("emailAddress")
            if email:
                discovered.setdefault(
                    email.lower(),
                    {
                        "jira_account_id": author.get("accountId"),
                        "username": author.get("displayName") or email,
                        "email": email,
                        "import": "map",
                    },
                )

        return list(discovered.values())

    def preview_states(self, extracted: dict[str, Any]) -> list[str]:
        states: set[str] = set()
        for issue in extracted.get("testcases", []):
            status = (issue.get("fields") or {}).get("status") or {}
            if status.get("name"):
                states.add(status["name"])
        return sorted(states)
