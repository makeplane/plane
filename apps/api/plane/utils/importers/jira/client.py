# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import base64
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


class JiraApiError(Exception):
    def __init__(self, message: str, *, path: str | None = None, details: Any = None):
        parsed_message = message
        if details:
            try:
                payload = json.loads(details) if isinstance(details, str) else details
                if isinstance(payload, dict):
                    error_messages = payload.get("errorMessages") or []
                    if error_messages:
                        parsed_message = "; ".join(str(item) for item in error_messages)
                    elif payload.get("message"):
                        parsed_message = str(payload["message"])
            except (json.JSONDecodeError, TypeError, AttributeError):
                pass
        super().__init__(parsed_message)
        self.path = path
        self.details = details


class JiraApiClient:
    def __init__(
        self,
        cloud_hostname: str,
        email: str,
        api_token: str,
        *,
        timeout: int = 60,
        max_retries: int = 2,
        retry_delay: float = 1,
    ):
        hostname = cloud_hostname.strip().rstrip("/")
        if hostname.startswith("https://"):
            hostname = hostname[len("https://") :]
        if hostname.startswith("http://"):
            hostname = hostname[len("http://") :]
        self.cloud_hostname = hostname
        self.email = email
        self.api_token = api_token
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    @property
    def base_url(self) -> str:
        return f"https://{self.cloud_hostname}"

    @property
    def api_base(self) -> str:
        return f"{self.base_url}/rest/api/3"

    def _auth_header(self) -> str:
        credentials = f"{self.email}:{self.api_token}".encode()
        encoded = base64.b64encode(credentials).decode("ascii")
        return f"Basic {encoded}"

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        body: dict[str, Any] | None = None,
    ) -> Any:
        url = f"{self.api_base}{path}"
        if params:
            query = urllib.parse.urlencode({key: value for key, value in params.items() if value is not None})
            url = f"{url}?{query}"

        data = None
        headers = {
            "Authorization": self._auth_header(),
            "Accept": "application/json",
        }
        if body is not None:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"

        for attempt in range(self.max_retries + 1):
            request = urllib.request.Request(url, data=data, headers=headers, method=method)

            try:
                with urllib.request.urlopen(request, timeout=self.timeout) as response:
                    raw = response.read()
                    if not raw:
                        return None
                    return json.loads(raw)
            except urllib.error.HTTPError as error:
                details = error.read().decode("utf-8", errors="replace")
                if error.code in {429, 500, 502, 503, 504} and attempt < self.max_retries:
                    self._sleep_before_retry(attempt)
                    continue
                raise JiraApiError(
                    f"HTTP {error.code} while calling {path}",
                    path=path,
                    details=details,
                ) from error
            except urllib.error.URLError as error:
                if attempt < self.max_retries:
                    self._sleep_before_retry(attempt)
                    continue
                raise JiraApiError(f"Connection error while calling {path}: {error.reason}", path=path) from error

        raise JiraApiError(f"Connection error while calling {path}", path=path)

    def _sleep_before_retry(self, attempt: int) -> None:
        if self.retry_delay <= 0:
            return
        time.sleep(self.retry_delay * (attempt + 1))

    def get(self, path: str, *, params: dict[str, Any] | None = None) -> Any:
        return self.request("GET", path, params=params)

    def post(self, path: str, *, body: dict[str, Any] | None = None) -> Any:
        return self.request("POST", path, body=body)

    def test_connection(self) -> bool:
        self.get("/myself")
        return True

    def get_project(self, project_key: str) -> dict[str, Any]:
        return self.get(f"/project/{urllib.parse.quote(project_key)}")

    def search_issues(
        self,
        *,
        jql: str,
        fields: list[str],
        next_page_token: str | None = None,
        max_results: int = 50,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "jql": jql,
            "maxResults": max_results,
            "fields": fields,
        }
        if next_page_token:
            body["nextPageToken"] = next_page_token
        return self.post("/search/jql", body=body)

    def list_comments(self, issue_key: str, *, start_at: int = 0, max_results: int = 50) -> dict[str, Any]:
        return self.get(
            f"/issue/{urllib.parse.quote(issue_key)}/comment",
            params={"startAt": start_at, "maxResults": max_results},
        )

    def get_issue_properties(self, issue_key: str) -> dict[str, Any]:
        return self.get(f"/issue/{urllib.parse.quote(issue_key)}/properties")

    def get_issue_property(self, issue_key: str, property_key: str) -> Any:
        return self.get(f"/issue/{urllib.parse.quote(issue_key)}/properties/{urllib.parse.quote(property_key)}")
