# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Integration client base (§7.9).

One place implements authentication, the timeout ceiling, request ids, the
degraded result envelope and call logging. Adapters only describe paths and how
to normalise a payload - they never talk to the network themselves.
"""

import hashlib
import hmac
import os
import time
import uuid
from dataclasses import dataclass, field

from django.conf import settings
from django.utils import timezone

from plane.db.models import ExternalSystemConnection, IntegrationCallLog
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)


class IntegrationErrorCode:
    NOT_CONFIGURED = "not_configured"
    DISABLED = "connection_disabled"
    TIMEOUT = "timeout"
    HTTP_ERROR = "http_error"
    INVALID_PAYLOAD = "invalid_payload"
    TRANSPORT_ERROR = "transport_error"


@dataclass
class IntegrationResult:
    """Uniform answer every integration call returns (P1-INT-06)."""

    system: str
    operation: str
    items: list = field(default_factory=list)
    degraded: bool = False
    degraded_reason: str = ""
    status_code: int | None = None
    latency_ms: int | None = None
    source_system: str = ""
    source_url: str = ""
    synced_at: str | None = None
    request_id: str = ""

    @property
    def ok(self):
        return not self.degraded

    def as_payload(self, **extra):
        payload = {
            "items": self.items,
            "count": len(self.items),
            "degraded": self.degraded,
            "source_system": self.system,
            "source_url": self.source_url,
            "synced_at": self.synced_at,
            "request_id": self.request_id,
        }
        if self.degraded:
            payload["degraded_reason"] = self.degraded_reason
        if self.status_code is not None:
            payload["status_code"] = self.status_code
        if self.latency_ms is not None:
            payload["latency_ms"] = self.latency_ms
        payload.update(extra)
        return payload


def resolve_secret(connection):
    """Read the credential from the backend secret store, never from the client."""
    if connection is None:
        return None
    if connection.credential_ref:
        value = getattr(settings, connection.credential_ref.upper(), None)
        if value:
            return value
        return os.environ.get(connection.credential_ref) or os.environ.get(connection.credential_ref.upper())
    system = str(connection.system).upper()
    return getattr(settings, f"{system}_AUTH_SECRET", None) or os.environ.get(f"{system}_AUTH_SECRET")


class BaseIntegrationClient:
    """Shared behaviour for every external system adapter."""

    system = ""
    search_path = "/search"
    health_path = "/health"
    external_type = ""
    operation = "search"

    def __init__(self, connection: ExternalSystemConnection | None = None):
        self.connection = connection

    # ------------------------------------------------------------------
    # configuration
    # ------------------------------------------------------------------
    @property
    def configured(self):
        return bool(self.connection and self.connection.base_url)

    @property
    def enabled(self):
        return bool(self.configured and self.connection.is_enabled)

    @property
    def timeout_seconds(self):
        if self.connection is None:
            return float(getattr(settings, "RESEARCH_INTEGRATION_TIMEOUT_SECONDS", 3))
        return float(self.connection.timeout_seconds or getattr(settings, "RESEARCH_INTEGRATION_TIMEOUT_SECONDS", 3))

    @property
    def cache_ttl_seconds(self):
        if self.connection is None:
            return int(getattr(settings, "RESEARCH_INTEGRATION_CACHE_TTL_SECONDS", 300))
        return int(self.connection.cache_ttl_seconds or 300)

    def headers(self, *, path, query=""):
        """Authentication headers. Credentials never leave the backend."""
        connection = self.connection
        if connection is None or connection.auth_mode == ExternalSystemConnection.AuthMode.NONE:
            return {}
        secret = resolve_secret(connection)
        if not secret:
            return {}
        if connection.auth_mode == ExternalSystemConnection.AuthMode.HMAC:
            timestamp = str(int(time.time()))
            signing_key = f"{timestamp}.{path}.{query}".encode()
            signature = hmac.new(secret.encode(), signing_key, hashlib.sha256).hexdigest()
            return {
                "X-AI4MS-Timestamp": timestamp,
                "X-AI4MS-Signature": signature,
                "X-AI4MS-System": self.system,
            }
        return {"Authorization": f"Bearer {secret}"}

    # ------------------------------------------------------------------
    # transport
    # ------------------------------------------------------------------
    def _log(self, *, operation, outcome, request_id, status_code=None, latency_ms=None, error_code="", request=None):
        workspace = self.connection.workspace if self.connection else None
        if workspace is None:
            return None
        IntegrationCallLog.objects.create(
            workspace=workspace,
            connection=self.connection,
            system=self.system,
            operation=operation,
            request_id=request_id,
            outcome=outcome,
            status_code=status_code,
            latency_ms=latency_ms,
            error_code=error_code,
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.INTEGRATION_CALL,
            resource_type=ResearchResourceType.INTEGRATION,
            resource_id=self.connection.id if self.connection else None,
            actor=getattr(request, "user", None) if request else None,
            metadata={
                "system": self.system,
                "operation": operation,
                "outcome": outcome,
                "error_code": error_code,
            },
            request=None,
        )
        return None

    def _result(
        self,
        *,
        operation,
        request_id,
        items=None,
        degraded=False,
        reason="",
        status_code=None,
        latency_ms=None,
    ):
        return IntegrationResult(
            system=self.system,
            operation=operation,
            items=items or [],
            degraded=degraded,
            degraded_reason=reason,
            status_code=status_code,
            latency_ms=latency_ms,
            source_system=self.system,
            source_url=self.connection.base_url if self.connection else "",
            synced_at=timezone.now().isoformat() if not degraded else None,
            request_id=request_id,
        )

    def request(self, *, path, params=None, operation=None, request=None):
        """Perform one external call and always answer with a result envelope."""
        operation = operation or self.operation
        request_id = uuid.uuid4().hex
        incoming_id = getattr(request, "headers", None) and request.headers.get("X-Research-Request-Id")
        if incoming_id:
            request_id = incoming_id

        if self.connection is None:
            self._log(
                operation=operation,
                outcome="DEGRADED",
                request_id=request_id,
                error_code=IntegrationErrorCode.NOT_CONFIGURED,
            )
            return self._result(
                operation=operation,
                request_id=request_id,
                degraded=True,
                reason=IntegrationErrorCode.NOT_CONFIGURED,
            )
        if not self.connection.is_enabled:
            self._log(
                operation=operation,
                outcome="DEGRADED",
                request_id=request_id,
                error_code=IntegrationErrorCode.DISABLED,
            )
            return self._result(
                operation=operation,
                request_id=request_id,
                degraded=True,
                reason=IntegrationErrorCode.DISABLED,
            )

        url = f"{self.connection.base_url.rstrip('/')}{path}"
        query = "&".join(f"{key}={value}" for key, value in sorted((params or {}).items()))
        started = time.monotonic()
        try:
            import httpx

            response = httpx.get(
                url,
                params=params or {},
                headers=self.headers(path=path, query=query),
                timeout=self.timeout_seconds,
                follow_redirects=True,
            )
            latency_ms = int((time.monotonic() - started) * 1000)
            if response.status_code >= 400:
                self._log(
                    operation=operation,
                    outcome="FAILED",
                    request_id=request_id,
                    status_code=response.status_code,
                    latency_ms=latency_ms,
                    error_code=IntegrationErrorCode.HTTP_ERROR,
                )
                self._mark_health(ok=False, error=IntegrationErrorCode.HTTP_ERROR)
                return self._result(
                    operation=operation,
                    request_id=request_id,
                    degraded=True,
                    reason=IntegrationErrorCode.HTTP_ERROR,
                    status_code=response.status_code,
                    latency_ms=latency_ms,
                )
            payload = response.json() if response.content else {}
            items = self.normalise(payload)
            self._log(
                operation=operation,
                outcome="SUCCESS",
                request_id=request_id,
                status_code=response.status_code,
                latency_ms=latency_ms,
            )
            self._mark_health(ok=True)
            return self._result(
                operation=operation,
                request_id=request_id,
                items=items,
                status_code=response.status_code,
                latency_ms=latency_ms,
            )
        except Exception as exc:
            latency_ms = int((time.monotonic() - started) * 1000)
            error_code = (
                IntegrationErrorCode.TIMEOUT
                if "Timeout" in exc.__class__.__name__ or "timeout" in str(exc).lower()
                else IntegrationErrorCode.TRANSPORT_ERROR
            )
            self._log(
                operation=operation,
                outcome="DEGRADED",
                request_id=request_id,
                latency_ms=latency_ms,
                error_code=error_code,
            )
            self._mark_health(ok=False, error=error_code)
            return self._result(
                operation=operation,
                request_id=request_id,
                degraded=True,
                reason=error_code,
                latency_ms=latency_ms,
            )

    def _mark_health(self, *, ok, error=""):
        if self.connection is None:
            return
        self.connection.health_status = (
            ExternalSystemConnection.HealthStatus.OK if ok else ExternalSystemConnection.HealthStatus.DEGRADED
        )
        self.connection.last_health_at = timezone.now()
        if ok:
            self.connection.last_success_at = timezone.now()
            self.connection.last_error = ""
        else:
            self.connection.last_error = error[:255]
        self.connection.save(
            update_fields=["health_status", "last_health_at", "last_success_at", "last_error", "updated_at"]
        )

    # ------------------------------------------------------------------
    # adapter hooks
    # ------------------------------------------------------------------
    def normalise(self, payload):
        """Map a source payload into reference shaped dictionaries."""
        raw_items = payload.get("items") if isinstance(payload, dict) else None
        if raw_items is None and isinstance(payload, list):
            raw_items = payload
        items = []
        for raw in raw_items or []:
            normalised = self.normalise_item(raw)
            if normalised:
                items.append(normalised)
        return items

    def normalise_item(self, raw):
        if not isinstance(raw, dict):
            return None
        external_id = raw.get("id") or raw.get("external_id")
        title = raw.get("title") or raw.get("name")
        if not external_id or not title:
            return None
        return {
            "external_id": str(external_id),
            "external_type": self.external_type,
            "external_parent_id": str(raw.get("parent_id") or raw.get("knowledge_base_id") or ""),
            "title": str(title)[:500],
            "summary": str(raw.get("summary") or raw.get("description") or "")[:2000],
            "source_url": str(raw.get("url") or raw.get("source_url") or ""),
            "acl_hint": raw.get("acl") or raw.get("acl_hint") or {},
            "metadata": {
                key: raw.get(key)
                for key in (
                    "status",
                    "author",
                    "updated_at",
                    "created_at",
                    "method",
                    "instrument",
                    "operator",
                )
                if raw.get(key) is not None
            },
        }

    def search(self, *, query="", params=None, request=None, operation=None):
        merged = {"q": query} if query else {}
        merged.update(params or {})
        return self.request(
            path=self.search_path,
            params=merged,
            operation=operation or self.operation,
            request=request,
        )

    def health(self, *, request=None):
        return self.request(path=self.health_path, operation="health", request=request)
