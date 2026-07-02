# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from .client import JiraApiClient

logger = logging.getLogger("plane.worker")

DEFAULT_RTM_API_BASES = (
    "https://rtm-api.hexygen.com/api",
    "https://rtm-eu-api.hexygen.com/api",
)


class RtmApiClient:
    def __init__(self, *, api_token: str, base_url: str | None = None, timeout: int = 60):
        self.api_token = api_token
        self.base_url = (base_url or DEFAULT_RTM_API_BASES[0]).rstrip("/")
        self.timeout = timeout

    def _request(self, url: str) -> Any:
        request = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {self.api_token}",
                "Accept": "application/json",
            },
            method="GET",
        )
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            raw = response.read()
            if not raw:
                return None
            return json.loads(raw)

    def get_test_case(self, test_key: str) -> dict[str, Any] | None:
        encoded_key = urllib.parse.quote(test_key)
        candidate_bases = [self.base_url, *DEFAULT_RTM_API_BASES]
        seen_bases: set[str] = set()
        candidate_paths = (
            f"/v2/test-cases/{encoded_key}",
            f"/v2/test-case/{encoded_key}",
            f"/test-cases/{encoded_key}",
        )

        for base in candidate_bases:
            normalized_base = base.rstrip("/")
            if normalized_base in seen_bases:
                continue
            seen_bases.add(normalized_base)
            for path in candidate_paths:
                try:
                    payload = self._request(f"{normalized_base}{path}")
                except urllib.error.HTTPError as error:
                    if error.code in {401, 403, 404}:
                        continue
                    logger.warning("RTM API request failed for %s%s: HTTP %s", normalized_base, path, error.code)
                    continue
                except urllib.error.URLError:
                    continue
                if isinstance(payload, dict):
                    return payload
        return None


def build_rtm_client(metadata: dict[str, Any]) -> RtmApiClient | None:
    api_token = metadata.get("rtm_api_token") or metadata.get("api_token")
    if not api_token:
        return None
    base_url = metadata.get("rtm_api_base_url")
    return RtmApiClient(api_token=str(api_token), base_url=base_url)


def parse_rtm_steps(payload: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not payload:
        return []

    steps: list[dict[str, Any]] = []
    step_groups = payload.get("stepGroups")
    if isinstance(step_groups, list):
        steps.extend(_parse_step_groups(step_groups))

    legacy_steps = payload.get("steps")
    if isinstance(legacy_steps, list):
        steps.extend(_parse_legacy_steps(legacy_steps))

    return steps


def _parse_step_groups(step_groups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    parsed: list[dict[str, Any]] = []
    for group in step_groups:
        group_name = group.get("name")
        for step in group.get("steps") or []:
            columns = step.get("stepColumns") or []
            ordered = sorted(columns, key=lambda column: int(str(column.get("ordinal") or 0)))
            values = [str(column.get("value") or "").strip() for column in ordered if column.get("value")]
            if not values:
                continue
            action = values[0]
            expected = values[2] if len(values) > 2 else (values[1] if len(values) > 1 else None)
            parsed.append(
                {
                    "action": action,
                    "expected": expected,
                    "group": group_name,
                }
            )
    return parsed


def _parse_legacy_steps(legacy_steps: list[Any]) -> list[dict[str, Any]]:
    parsed: list[dict[str, Any]] = []
    current_group: str | None = None
    for row in legacy_steps:
        if not isinstance(row, list):
            continue
        if len(row) == 1 and isinstance(row[0], dict) and row[0].get("groupName"):
            current_group = str(row[0]["groupName"])
            continue
        values = [str(cell.get("value") or "").strip() for cell in row if isinstance(cell, dict) and cell.get("value")]
        if not values:
            continue
        action = values[0]
        expected = values[2] if len(values) > 2 else (values[1] if len(values) > 1 else None)
        parsed.append({"action": action, "expected": expected, "group": current_group})
    return parsed


def fetch_rtm_steps_for_issue(
    *,
    jira_client: JiraApiClient,
    rtm_client: RtmApiClient | None,
    issue_key: str,
) -> list[dict[str, Any]]:
    if rtm_client:
        try:
            payload = rtm_client.get_test_case(issue_key)
            steps = parse_rtm_steps(payload)
            if steps:
                return steps
        except Exception as error:
            logger.warning("Failed to fetch RTM steps for %s: %s", issue_key, error)

    return _fetch_steps_from_jira_properties(jira_client, issue_key)


def _fetch_steps_from_jira_properties(jira_client: JiraApiClient, issue_key: str) -> list[dict[str, Any]]:
    try:
        properties = jira_client.get_issue_properties(issue_key)
    except Exception:
        return []

    keys = (properties or {}).get("keys") or []
    for item in keys:
        property_key = item.get("key") if isinstance(item, dict) else None
        if not property_key or "step" not in property_key.lower():
            continue
        try:
            value = jira_client.get_issue_property(issue_key, property_key)
        except Exception:
            continue
        if isinstance(value, dict):
            steps = parse_rtm_steps(value)
            if steps:
                return steps
    return []
