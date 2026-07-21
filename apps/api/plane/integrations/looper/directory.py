"""Read-only loopernet membership lookup for strict Looper dispatch.

Plane owns dispatch lifecycle state.  This client is intentionally limited to
presence and capability checks and never mutates a dispatch from heartbeat
data.
"""

import ipaddress
import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime


MAX_RESPONSE_BYTES = 1024 * 1024


class DirectoryUnavailable(RuntimeError):
    pass


@dataclass(frozen=True)
class NodePresence:
    node_id: str
    node_name: str
    online: bool
    strict_dispatch_v1: bool
    last_heartbeat_at: datetime | None


@dataclass(frozen=True)
class DirectorySnapshot:
    network_id: str
    nodes: dict[str, NodePresence]
    checked_at: datetime

    def node(self, node_id):
        return self.nodes.get(node_id)


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise HTTPError(req.full_url, code, "loopernet redirects are disabled", headers, fp)


def _validate_base_url(value):
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.path not in {"", "/"}:
        raise DirectoryUnavailable("LOOPERNET_BASE_URL must be an origin URL")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise DirectoryUnavailable("LOOPERNET_BASE_URL must not contain credentials or query data")
    try:
        loopback = ipaddress.ip_address(parsed.hostname).is_loopback
    except ValueError:
        loopback = parsed.hostname == "localhost"
    if parsed.scheme != "https" and not loopback:
        raise DirectoryUnavailable("loopernet must use HTTPS outside localhost")
    return value.rstrip("/")


def _load_service_token(path_value):
    path = Path(path_value)
    try:
        mode = os.stat(path).st_mode & 0o777
        raw = path.read_text().strip()
    except OSError as exc:
        raise DirectoryUnavailable("loopernet service credential cannot be read") from exc
    if mode & 0o077:
        raise DirectoryUnavailable("loopernet service credential must not be group/world accessible")
    if not raw:
        raise DirectoryUnavailable("loopernet service credential is empty")
    if raw.startswith("{"):
        try:
            value = json.loads(raw)
            raw = str(value["nodeToken"]).strip()
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            raise DirectoryUnavailable("loopernet service credential JSON must contain nodeToken") from exc
    if not raw:
        raise DirectoryUnavailable("loopernet service credential token is empty")
    return raw


def _parse_heartbeat(value):
    if not value:
        return None
    parsed = parse_datetime(value)
    if parsed is None:
        raise DirectoryUnavailable("loopernet returned an invalid heartbeat timestamp")
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed)
    return parsed


def get_directory_snapshot():
    base_url = getattr(settings, "LOOPERNET_BASE_URL", "")
    network_id = getattr(settings, "LOOPERNET_NETWORK_ID", "")
    credential_file = getattr(settings, "LOOPERNET_SERVICE_CREDENTIAL_FILE", "")
    if not base_url or not network_id or not credential_file:
        raise DirectoryUnavailable("loopernet directory is not configured")

    base_url = _validate_base_url(base_url)
    token = _load_service_token(credential_file)
    timeout = float(getattr(settings, "LOOPERNET_DIRECTORY_TIMEOUT_SECONDS", 2.0))
    request = Request(
        f"{base_url}/v1/status",
        headers={"Accept": "application/json", "Authorization": f"Bearer {token}"},
        method="GET",
    )
    try:
        with build_opener(_NoRedirect()).open(request, timeout=timeout) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except (HTTPError, URLError, OSError, TimeoutError) as exc:
        raise DirectoryUnavailable("loopernet directory request failed") from exc
    if len(raw) > MAX_RESPONSE_BYTES:
        raise DirectoryUnavailable("loopernet directory response is too large")
    try:
        payload = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise DirectoryUnavailable("loopernet directory returned invalid JSON") from exc
    if payload.get("networkId") != network_id:
        raise DirectoryUnavailable("loopernet directory returned the wrong network")

    now = timezone.now()
    max_age_seconds = int(getattr(settings, "LOOPERNET_PRESENCE_MAX_AGE_SECONDS", 90))
    nodes = {}
    for item in payload.get("memberships", []):
        node_id = item.get("nodeId")
        if not isinstance(node_id, str) or not node_id:
            continue
        heartbeat = _parse_heartbeat(item.get("lastHeartbeatAt"))
        age = (now - heartbeat).total_seconds() if heartbeat is not None else None
        capabilities = item.get("capabilities") if isinstance(item.get("capabilities"), dict) else {}
        nodes[node_id] = NodePresence(
            node_id=node_id,
            node_name=str(item.get("nodeName") or node_id),
            online=age is not None and -5 <= age <= max_age_seconds,
            strict_dispatch_v1=capabilities.get("strictDispatchV1") is True,
            last_heartbeat_at=heartbeat,
        )
    return DirectorySnapshot(network_id=network_id, nodes=nodes, checked_at=now)
