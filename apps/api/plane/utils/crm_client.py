# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import requests


class CrmApiError(Exception):
    """Raised when the CRM API returns an error or is unreachable."""


class CrmApiClient:
    """Thin HTTP client for the Perfex CRM ``plane_api`` module.

    Talks to the module endpoints using a Bearer token and a shared
    ``requests.Session`` for connection reuse. All methods raise
    :class:`CrmApiError` on transport or HTTP errors so callers can handle a
    single exception type.
    """

    DEFAULT_TIMEOUT = 30

    def __init__(self, base_url, api_key, timeout=DEFAULT_TIMEOUT, verify=True):
        self.base_url = (base_url or "").rstrip("/")
        self.timeout = timeout
        # TLS verification. Disabled only for local testing (self-signed CRM);
        # callers pass settings.CRM_VERIFY_SSL which defaults to True.
        self.verify = verify
        if not verify:
            from urllib3.exceptions import InsecureRequestWarning

            requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
        self._session = requests.Session()
        self._session.headers.update(
            {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        )

    # ─── Internal helpers ─────────────────────────────────────────────────

    def _url(self, path):
        return f"{self.base_url}/admin/plane_api/plane_api/{path.lstrip('/')}"

    def _request(self, method, path, **kwargs):
        kwargs.setdefault("timeout", self.timeout)
        kwargs.setdefault("verify", self.verify)
        try:
            response = self._session.request(method, self._url(path), **kwargs)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise CrmApiError(str(exc)) from exc
        try:
            return response.json()
        except ValueError as exc:
            raise CrmApiError("CRM returned a non-JSON response") from exc

    # ─── Public API ───────────────────────────────────────────────────────

    def get_projects(self):
        """Return the list of CRM projects. Doubles as a connectivity check."""
        return self._request("GET", "projects").get("data", [])

    def get_custom_fields(self, entity="tasks"):
        """Return the CRM custom-field definitions for an entity (default tasks)."""
        return self._request(
            "GET", "custom_fields", params={"entity": entity}
        ).get("data", [])

    def create_task(self, project_id, name, description):
        """Create a CRM task under a project and return the created task payload."""
        return self._request(
            "POST",
            "tasks",
            json={
                "project_id": int(project_id),
                "name": name,
                "description": description,
            },
        ).get("data", {})

    def set_custom_field(self, task_id, field_id, value):
        """Set a single custom-field value on a CRM task."""
        return self._request(
            "PATCH",
            "task_custom_fields",
            json={
                "task_id": int(task_id),
                "fields": [{"field_id": int(field_id), "value": value}],
            },
        )
