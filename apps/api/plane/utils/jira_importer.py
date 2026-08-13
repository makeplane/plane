# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from datetime import datetime
from email.utils import parsedate_to_datetime
from time import sleep
from urllib.parse import quote, urlencode

import requests

from plane.utils.url_security import pinned_fetch


JIRA_EXTERNAL_SOURCE = "jira"
JIRA_REQUEST_TIMEOUT_SECONDS = 10
JIRA_MAX_RETRIES = 2
JIRA_PAGE_SIZE = 50
JIRA_IMPORT_LIMIT = 500


class JiraImporterError(Exception):
    """Raised when Jira cannot be queried safely."""


def normalize_jira_hostname(hostname: str) -> str:
    value = (hostname or "").strip().lower()
    if value.startswith("http://") or value.startswith("https://"):
        value = value.split("//", 1)[1]
    value = value.strip("/")
    if not value or "/" in value or "@" in value or ":" in value:
        raise JiraImporterError("Enter a valid Jira Cloud hostname.")
    return value


def redact_jira_metadata(metadata: dict) -> dict:
    return {
        "cloud_hostname": normalize_jira_hostname(metadata.get("cloud_hostname", "")),
        "project_key": str(metadata.get("project_key", "")).strip().upper(),
        "email": str(metadata.get("email", "")).strip(),
    }


class JiraClient:
    def __init__(self, metadata: dict):
        self.hostname = normalize_jira_hostname(metadata.get("cloud_hostname", ""))
        self.email = str(metadata.get("email", "")).strip()
        self.api_token = str(metadata.get("api_token", "")).strip()
        self.project_key = str(metadata.get("project_key", "")).strip().upper()
        if not self.email or not self.api_token or not self.project_key:
            raise JiraImporterError("Jira hostname, email, token, and project key are required.")

    def get_project_summary(self) -> dict:
        self._request("GET", f"/rest/api/3/project/{quote(self.project_key)}")
        statuses = self._search_statuses()
        labels = self._search_labels()
        users = self._search_users()
        issue_count = self._search_total("project = {}".format(self._jql_string(self.project_key)))
        epic_count = self._search_total(
            "project = {} AND issuetype = Epic".format(self._jql_string(self.project_key))
        )
        return {
            "issues": issue_count,
            "modules": epic_count,
            "labels": len(labels),
            "states": len(statuses),
            "users": users,
        }

    def iter_issues(self, limit: int = JIRA_IMPORT_LIMIT):
        fetched = 0
        next_page_token = None
        while fetched < limit:
            max_results = min(JIRA_PAGE_SIZE, limit - fetched)
            body = {
                "jql": "project = {} ORDER BY created ASC".format(self._jql_string(self.project_key)),
                "maxResults": max_results,
                "fields": ["summary", "description", "status", "priority", "labels", "created", "updated"],
            }
            if next_page_token:
                body["nextPageToken"] = next_page_token
            issue_page = self._request("POST", "/rest/api/3/search/jql", json=body)
            issues = issue_page.get("issues", [])
            if not issues:
                return
            for issue in issues:
                fetched += 1
                yield issue
                if fetched >= limit:
                    return
            if issue_page.get("isLast", True):
                return
            next_page_token = issue_page.get("nextPageToken")
            if not next_page_token:
                return

    def _search_total(self, jql: str) -> int:
        search_response = self._request(
            "POST",
            "/rest/api/3/search/jql",
            json={"jql": jql, "maxResults": 1, "fields": []},
        )
        return int(search_response.get("total", 0))

    def _search_statuses(self) -> list[dict]:
        project_statuses = self._request("GET", f"/rest/api/3/project/{quote(self.project_key)}/statuses")
        statuses = []
        seen = set()
        for issue_type in project_statuses:
            for status in issue_type.get("statuses", []):
                status_id = status.get("id") or status.get("name")
                if status_id and status_id not in seen:
                    seen.add(status_id)
                    statuses.append(status)
        return statuses

    def _search_labels(self) -> list[str]:
        search_response = self._request(
            "POST",
            "/rest/api/3/search/jql",
            json={
                "jql": "project = {}".format(self._jql_string(self.project_key)),
                "maxResults": 100,
                "fields": ["labels"],
            },
        )
        labels = set()
        for issue in search_response.get("issues", []):
            labels.update(issue.get("fields", {}).get("labels") or [])
        return sorted(labels)

    def _search_users(self) -> list[dict]:
        query = urlencode({"query": self.project_key, "maxResults": 50})
        users = self._request("GET", f"/rest/api/3/user/search?{query}")
        return [self._normalize_user(user) for user in users]

    def _request(self, method: str, path: str, **kwargs):
        url = f"https://{self.hostname}{path}"
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        headers.update(kwargs.pop("headers", {}))
        for attempt in range(JIRA_MAX_RETRIES + 1):
            try:
                response = pinned_fetch(
                    method,
                    url,
                    allowed_hosts={self.hostname},
                    headers=headers,
                    timeout=JIRA_REQUEST_TIMEOUT_SECONDS,
                    auth=(self.email, self.api_token),
                    **kwargs,
                )
            except (ValueError, requests.RequestException) as exc:
                if attempt >= JIRA_MAX_RETRIES:
                    raise JiraImporterError("Unable to connect to Jira.") from exc
                sleep(2**attempt)
                continue

            if response.status_code == 429 and attempt < JIRA_MAX_RETRIES:
                sleep(self._retry_after_seconds(response.headers.get("Retry-After")))
                continue
            if response.status_code in {500, 502, 503, 504} and attempt < JIRA_MAX_RETRIES:
                sleep(2**attempt)
                continue
            if response.status_code in {401, 403}:
                raise JiraImporterError("Jira authentication failed.")
            if response.status_code == 404:
                raise JiraImporterError("Jira project was not found.")
            if response.status_code >= 400:
                raise JiraImporterError("Jira returned an error while processing the request.")
            try:
                return response.json()
            except ValueError as exc:
                raise JiraImporterError("Jira returned an invalid response.") from exc

        raise JiraImporterError("Jira request retry limit exceeded.")

    @staticmethod
    def _retry_after_seconds(value: str | None) -> int:
        if not value:
            return 1
        try:
            return max(1, min(int(value), 30))
        except ValueError:
            try:
                retry_at = parsedate_to_datetime(value)
                return max(1, min(int((retry_at - datetime.now(retry_at.tzinfo)).total_seconds()), 30))
            except (TypeError, ValueError):
                return 1

    @staticmethod
    def _jql_string(value: str) -> str:
        return '"{}"'.format(value.replace('"', '\\"'))

    @staticmethod
    def _normalize_user(user: dict) -> dict:
        return {
            "self": user.get("self", ""),
            "accountId": user.get("accountId", ""),
            "accountType": user.get("accountType", ""),
            "emailAddress": user.get("emailAddress", ""),
            "avatarUrls": user.get("avatarUrls", {}),
            "displayName": user.get("displayName", ""),
            "active": bool(user.get("active", False)),
            "locale": user.get("locale", ""),
        }


def jira_adf_to_text(value) -> str:
    if not value:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(filter(None, [jira_adf_to_text(item) for item in value]))
    if not isinstance(value, dict):
        return ""
    text = value.get("text", "")
    children = jira_adf_to_text(value.get("content", []))
    return " ".join(filter(None, [text, children])).strip()


def jira_priority(value: dict | None) -> str:
    priority = ((value or {}).get("name") or "").lower()
    if priority in {"highest", "critical", "blocker"}:
        return "urgent"
    if priority == "high":
        return "high"
    if priority == "medium":
        return "medium"
    if priority in {"low", "lowest"}:
        return "low"
    return "none"
