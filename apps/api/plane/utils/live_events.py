# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Ids-only live events for work items.

After a mutation is recorded, the affected work item ids are published to a
Redis channel per project so a subscriber can tell connected clients to
refetch. No content is ever published, only ids.

Channel: ``plane:live-events:<project_id>``

Payload (JSON)::

    {"v": 1, "project_id": "<uuid>", "kind": "<entity>", "verb": "<verb>",
     "issue_ids": ["<uuid>", ...] | "*", "actor_id": "<uuid>" | null,
     "ts": <epoch seconds, float>, "settle": bool}

``ts`` is the publish time. ``issue_ids`` is ``"*"`` when the affected set is
unknown or larger than ``MAX_IDS`` (applied both when ids are extracted and
again at publish time), meaning "refetch everything in the project". ``settle`` asks the
subscriber to also refetch after a short delay, for deletes whose rows may
still be visible to a read that races the write.

Affected ids come from ``extract_issue_ids``, which also covers the parent of a
sub-issue on assign, create with parent, reparent and delete (``issue.`` types)
and the ``related_issue`` of a relation delete.

Publishing is gated by ``LIVE_EVENTS_ENABLED == "1"`` and never raises.
"""

# Python imports
import json
import logging
import os
import re
import threading
import time
import uuid
from urllib.parse import urlparse

# Third party imports
import redis

# Django imports
from django.conf import settings

logger = logging.getLogger("plane.worker")

CHANNEL_PREFIX = "plane:live-events:"
MAX_IDS = 500
SOCKET_TIMEOUT_SECONDS = 1
ALL_IDS = "*"
# Kinds of project metadata, published by publish_metadata_event: state, label, cycle and module definitions
# (kinds of their own, so they do not mix with the "cycle"/"module" membership kinds) and estimates.
METADATA_KINDS = frozenset({"state", "label", "cycle_definition", "module_definition", "estimate"})

_UUID_RE = re.compile(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")


def _build_client():
    """A short-timeout Redis client, so a hung Redis cannot stall a request or task."""
    timeouts = {"socket_connect_timeout": SOCKET_TIMEOUT_SECONDS, "socket_timeout": SOCKET_TIMEOUT_SECONDS}
    if settings.REDIS_SSL:
        url = urlparse(settings.REDIS_URL)
        return redis.Redis(
            host=url.hostname, port=url.port, password=url.password, ssl=True, ssl_cert_reqs=None, **timeouts
        )
    return redis.Redis.from_url(settings.REDIS_URL, db=0, **timeouts)


_client = None
_client_pid = None
_client_lock = threading.Lock()


def _reset_after_fork():
    """In a forked child: drop the parent's client and use a new lock.

    The lock could have been held by another parent thread at fork time, and
    that thread does not exist in the child, so the old lock would never be
    released. The inherited client is abandoned, not closed: the parent still
    owns those sockets.
    """
    global _client, _client_pid, _client_lock
    _client = None
    _client_pid = None
    _client_lock = threading.Lock()


if hasattr(os, "register_at_fork"):
    os.register_at_fork(after_in_child=_reset_after_fork)


def _publish_client():
    """The shared publish client, created lazily on first use.

    One client (and its connection pool, which is thread safe and replaces a
    connection that broke, for example after a Redis restart) is kept per
    process. It is keyed by pid so a forked gunicorn or celery worker never
    reuses its parent's sockets and builds its own after the fork.
    """
    global _client, _client_pid
    pid = os.getpid()
    client = _client
    if client is not None and _client_pid == pid:
        return client
    with _client_lock:
        if _client is None or _client_pid != pid:
            # Not closed when inherited: the parent still owns those sockets.
            _client = _build_client()
            _client_pid = pid
        return _client


def live_events_enabled():
    return os.environ.get("LIVE_EVENTS_ENABLED") == "1"


def publish_work_item_event(project_id, issue_ids, kind, verb, actor_id, settle=False):
    """Publish an ids-only event for a project. Never raises."""
    try:
        if not live_events_enabled():
            return False
        if issue_ids != ALL_IDS:
            issue_ids = list(dict.fromkeys(str(i) for i in issue_ids))
            if not issue_ids:
                return False
            if len(issue_ids) > MAX_IDS:
                issue_ids = ALL_IDS
        payload = {
            "v": 1,
            "project_id": str(project_id),
            "kind": kind,
            "verb": verb,
            "issue_ids": issue_ids,
            "actor_id": str(actor_id) if actor_id else None,
            "ts": time.time(),
            "settle": bool(settle),
        }
        client = _publish_client()
        client.publish(CHANNEL_PREFIX + str(project_id), json.dumps(payload))
        return True
    except Exception as e:
        # Log the exception type only; connection errors can carry the Redis URL.
        logger.warning("live event publish failed: %s", type(e).__name__)
        return False


def publish_metadata_event(project_id, kind, verb, actor_id, settle=False):
    """Publish an ids-only event for a project's metadata (state, label, cycle or module definitions).

    No work item ids are involved, so ``issue_ids`` is ``"*"``: subscribers refresh the
    project's metadata stores (and, as a full refresh, its work item lists). Never raises.
    Only METADATA_KINDS are published (the hub drops unknown kinds).
    """
    if kind not in METADATA_KINDS:
        logger.warning("live metadata event skipped: unknown kind %s", kind)
        return False
    return publish_work_item_event(project_id, ALL_IDS, kind, verb, actor_id, settle=settle)


def _load(value):
    """Accept a JSON string, a dict or None; return a dict (possibly empty)."""
    if isinstance(value, (str, bytes)):
        try:
            value = json.loads(value)
        except ValueError:
            return {}
    return value if isinstance(value, dict) else {}


def _uuid_or_none(value):
    if value is None:
        return None
    try:
        return str(uuid.UUID(str(value)))
    except ValueError:
        return None


def _ids_from_list_or_repr(value):
    """A list of ids, or a string holding ids (for example a QuerySet repr)."""
    if isinstance(value, (list, tuple, set)):
        return [_uuid_or_none(v) for v in value]
    if isinstance(value, str):
        return [m.lower() for m in _UUID_RE.findall(value)]
    return []


def _ids_from_records(value, key):
    """[{key: id}, ...] -> ids."""
    if not isinstance(value, (list, tuple)):
        return []
    return [_uuid_or_none(r.get(key)) for r in value if isinstance(r, dict)]


def _ids_from_created_records(value):
    """A list, or a Django serializers JSON string, of records -> [].fields.issue."""
    if isinstance(value, (str, bytes)):
        try:
            value = json.loads(value)
        except ValueError:
            return []
    if not isinstance(value, (list, tuple)):
        return []
    out = []
    for record in value:
        fields = record.get("fields") if isinstance(record, dict) else None
        if isinstance(fields, dict):
            out.append(_uuid_or_none(fields.get("issue")))
    return out


def extract_issue_ids(type, issue_id, requested_data, current_instance, activities):
    """Return the work item ids an issue_activity call touched, or ``"*"``.

    Union of: (a) issue_id unless it is really a cycle or module id, (b)
    requested_data issues, (c) cycles_list, (d) modules_list, (e)
    updated_cycle_issues / updated_module_issues, (f) created_cycle_issues /
    created_module_issues, (g) the in-memory activity rows, (h) for ``issue.``
    types only, the sub-issue parent in requested_data and current_instance
    (sub-issue assign, create with parent, reparent through update, delete)
    (``parent``: an id or a dict with an ``id``), (i) for ``issue_relation``
    types only, requested_data ``related_issue`` (the relation delete shape).
    """
    try:
        req = _load(requested_data)
        cur = _load(current_instance)
        found = []

        # (a) app cycle destroy passes the cycle pk as issue_id
        candidate = _uuid_or_none(issue_id)
        parent_ids = {str(req.get("cycle_id")), str(req.get("module_id"))}
        if candidate is not None and candidate not in parent_ids:
            found.append(candidate)

        # (b)-(d)
        found += _ids_from_list_or_repr(req.get("issues"))
        found += _ids_from_list_or_repr(req.get("cycles_list"))
        found += _ids_from_list_or_repr(req.get("modules_list"))

        # (e)
        found += _ids_from_records(cur.get("updated_cycle_issues"), "issue_id")
        found += _ids_from_records(cur.get("updated_module_issues"), "issue_id")

        # (f)
        found += _ids_from_created_records(cur.get("created_cycle_issues"))
        found += _ids_from_created_records(cur.get("created_module_issues"))

        # (g)
        found += [_uuid_or_none(getattr(a, "issue_id", None)) for a in (activities or [])]

        # (h) sub-issue parent: assign, create with parent, reparent through update
        # (delete sends current_instance={"parent": id} for a sub-issue, {} otherwise)
        if str(type).startswith("issue."):
            for source in (req, cur):
                parent = source.get("parent")
                if isinstance(parent, dict):
                    parent = parent.get("id")
                found.append(_uuid_or_none(parent))

        # (i) relation delete sends the other issue as related_issue
        if str(type).startswith("issue_relation"):
            found.append(_uuid_or_none(req.get("related_issue")))

        ids = list(dict.fromkeys(i for i in found if i))
        if len(ids) > MAX_IDS or (not ids and issue_id is None):
            return ALL_IDS
        return ids
    except Exception as e:
        logger.warning("live event id extraction failed: %s", type(e).__name__)
        return ALL_IDS
