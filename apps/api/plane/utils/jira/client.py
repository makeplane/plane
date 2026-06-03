# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""A thin Jira Cloud REST API client used by the importer.

Auth is HTTP Basic with an Atlassian account email + API token. Network calls
are isolated in ``_request`` so the client can be exercised with a mocked
``requests.Session`` in tests.
"""

# Python imports
import time

# Third party imports
import requests

# Module imports
from plane.utils.ip_address import validate_url
from .mappers import normalize_domain

API_V3 = "api3"
AGILE = "agile"

_MAX_RESULTS = 50
_MAX_RETRIES = 3

# Default issue fields requested from Jira's search API.
DEFAULT_ISSUE_FIELDS = [
    "summary",
    "description",
    "status",
    "priority",
    "labels",
    "assignee",
    "reporter",
    "creator",
    "issuetype",
    "parent",
    "components",
    "duedate",
    "created",
    "updated",
    "issuelinks",
    "attachment",
]

# schema.custom value identifying the classic "Epic Link" custom field.
EPIC_LINK_SCHEMA = "com.pyxis.greenhopper.jira:gh-epic-link"


class JiraError(Exception):
    """Raised when the Jira API returns an error or is unreachable."""

    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.status_code = status_code


class JiraClient:
    def __init__(self, domain, email, token, session=None, timeout=30):
        self.domain = normalize_domain(domain)
        self.auth = (email, token)
        self.timeout = timeout
        self.session = session or requests.Session()

    # -- low level ---------------------------------------------------------
    def _base_url(self, base):
        if base == AGILE:
            return f"https://{self.domain}/rest/agile/1.0"
        return f"https://{self.domain}/rest/api/3"

    def _request(self, method, path, base=API_V3, params=None, **kwargs):
        url = f"{self._base_url(base)}{path}"
        # SSRF guard: reject domains that resolve to private/internal addresses.
        try:
            validate_url(url)
        except ValueError as exc:
            raise JiraError(f"Invalid Jira domain: {exc}")
        last_exc = None
        for attempt in range(_MAX_RETRIES):
            try:
                response = self.session.request(
                    method,
                    url,
                    auth=self.auth,
                    params=params,
                    timeout=self.timeout,
                    # Do not follow redirects: a 30x could bounce into the internal network.
                    allow_redirects=False,
                    headers={"Accept": "application/json", "Content-Type": "application/json"},
                    **kwargs,
                )
            except requests.RequestException as exc:
                last_exc = exc
                time.sleep(2**attempt)
                continue

            # Retry on rate limit / transient server errors
            if response.status_code in (429, 500, 502, 503, 504) and attempt < _MAX_RETRIES - 1:
                retry_after = response.headers.get("Retry-After")
                time.sleep(int(retry_after) if retry_after and retry_after.isdigit() else 2**attempt)
                continue

            if response.status_code == 401:
                raise JiraError("Invalid Jira credentials", status_code=401)
            if response.status_code == 403:
                raise JiraError("Jira denied access (check permissions)", status_code=403)
            # Redirects are not followed (SSRF guard); treat them as failures.
            if response.is_redirect or response.status_code in (301, 302, 303, 307, 308):
                raise JiraError("Jira returned an unexpected redirect", status_code=response.status_code)
            if response.status_code >= 400:
                # Do not reflect the upstream response body back to the caller.
                raise JiraError(
                    f"Jira request failed (status {response.status_code})",
                    status_code=response.status_code,
                )
            return response.json() if response.content else {}

        raise JiraError(f"Could not reach Jira: {last_exc}")

    def _paginate_values(self, path, base, params=None):
        """Iterate Jira agile-style {startAt,maxResults,total,isLast,values} pages."""
        params = dict(params or {})
        start_at = 0
        results = []
        while True:
            params.update({"startAt": start_at, "maxResults": _MAX_RESULTS})
            page = self._request("GET", path, base=base, params=params)
            values = page.get("values", [])
            results.extend(values)
            if page.get("isLast") or not values or len(results) >= page.get("total", 0):
                break
            start_at += len(values)
        return results

    # -- auth --------------------------------------------------------------
    def myself(self):
        return self._request("GET", "/myself")

    def test_connection(self):
        """Return (ok, message)."""
        try:
            me = self.myself()
            return True, me.get("displayName") or me.get("emailAddress") or "Connected"
        except JiraError as exc:
            return False, str(exc)

    # -- discovery ---------------------------------------------------------
    def boards(self):
        return self._paginate_values("/board", base=AGILE)

    def board(self, board_id):
        return self._request("GET", f"/board/{board_id}", base=AGILE)

    def board_projects(self, board_id):
        return self._paginate_values(f"/board/{board_id}/project", base=AGILE)

    def project(self, project_key):
        return self._request("GET", f"/project/{project_key}")

    def project_statuses(self, project_key):
        return self._request("GET", f"/project/{project_key}/statuses")

    def priorities(self):
        result = self._request("GET", "/priority")
        return result if isinstance(result, list) else result.get("values", [])

    def assignable_users(self, project_key):
        users = []
        start_at = 0
        while True:
            page = self._request(
                "GET",
                "/user/assignable/search",
                params={"project": project_key, "startAt": start_at, "maxResults": _MAX_RESULTS},
            )
            if not isinstance(page, list):
                page = page.get("values", [])
            users.extend(page)
            if len(page) < _MAX_RESULTS:
                break
            start_at += len(page)
        return users

    # -- sprints -----------------------------------------------------------
    def sprints(self, board_id):
        try:
            return self._paginate_values(f"/board/{board_id}/sprint", base=AGILE)
        except JiraError as exc:
            # Kanban boards have no sprints (400/404) - treat as none
            if exc.status_code in (400, 404):
                return []
            raise

    def sprint_issue_keys(self, sprint_id):
        keys = []
        start_at = 0
        while True:
            page = self._request(
                "GET",
                f"/sprint/{sprint_id}/issue",
                base=AGILE,
                params={"startAt": start_at, "maxResults": _MAX_RESULTS, "fields": "key"},
            )
            issues = page.get("issues", [])
            keys.extend(issue["key"] for issue in issues)
            if len(issues) < _MAX_RESULTS or len(keys) >= page.get("total", 0):
                break
            start_at += len(issues)
        return keys

    # -- issues ------------------------------------------------------------
    def fields(self):
        """List all Jira fields (used to discover dynamic custom-field ids)."""
        result = self._request("GET", "/field")
        return result if isinstance(result, list) else result.get("values", [])

    def epic_link_field_id(self):
        """Resolve the classic 'Epic Link' custom field id, or None if absent."""
        for field in self.fields():
            if (field.get("schema") or {}).get("custom") == EPIC_LINK_SCHEMA:
                return field.get("id")
        return None

    def search_issues(self, jql, fields=None, expand="renderedFields", page_size=_MAX_RESULTS):
        """Yield Jira issues for a JQL query, transparently paginated."""
        start_at = 0
        fields = fields or list(DEFAULT_ISSUE_FIELDS)
        while True:
            page = self._request(
                "GET",
                "/search",
                params={
                    "jql": jql,
                    "startAt": start_at,
                    "maxResults": page_size,
                    "fields": ",".join(fields),
                    "expand": expand,
                },
            )
            issues = page.get("issues", [])
            for issue in issues:
                yield issue
            total = page.get("total", 0)
            start_at += len(issues)
            if not issues or start_at >= total:
                break

    def issue_count(self, jql):
        page = self._request("GET", "/search", params={"jql": jql, "maxResults": 0})
        return page.get("total", 0)

    def issue_comments(self, issue_key):
        comments = []
        start_at = 0
        while True:
            page = self._request(
                "GET",
                f"/issue/{issue_key}/comment",
                params={"startAt": start_at, "maxResults": _MAX_RESULTS, "expand": "renderedBody"},
            )
            batch = page.get("comments", [])
            comments.extend(batch)
            if len(batch) < _MAX_RESULTS or len(comments) >= page.get("total", 0):
                break
            start_at += len(batch)
        return comments

    def download_attachment(self, content_url):
        """Download attachment bytes from a Jira content URL (SSRF-guarded)."""
        try:
            validate_url(content_url)
        except ValueError as exc:
            raise JiraError(f"Refusing to download attachment: {exc}")
        response = self.session.get(
            content_url, auth=self.auth, timeout=self.timeout, stream=True, allow_redirects=False
        )
        if response.status_code >= 400:
            raise JiraError(f"Attachment download failed ({response.status_code})", status_code=response.status_code)
        return response.content
