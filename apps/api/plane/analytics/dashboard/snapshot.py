# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Read-snapshot helper for the Team Operations Dashboard.

Spec §9.4: every KPI, chart, panel and drilldown row in a single
request MUST share the same MVCC snapshot — a row cannot appear in
the KPI totals but vanish from the items drilldown.

This module provides :func:`dashboard_snapshot`, a context manager
that opens a transaction with
``SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`` BEFORE
any SELECT runs through the connection. PostgreSQL pins the MVCC
snapshot at the first read inside the transaction; subsequent
SELECTs in the same transaction see the same data even if another
writer commits.

Design rules (per retry brief, ``msg_1311ee14c123``):
====================================================

* **No silent fallback.** If the SET TRANSACTION cannot be applied,
  the request FAILS — never silently falls back to READ COMMITTED.
* **No swallowed exceptions.** Any DB error during snapshot
  acquisition propagates after the atomic block rolls back. Catching
  inside ``atomic`` would leave the connection in an aborted state
  and is forbidden.
* **Nested transaction safety.** When invoked inside an outer
  transaction (savepoint) the SET TRANSACTION cannot apply — we
  inspect the connection's actual isolation + read_only and only
  reuse the outer transaction if it is already RR + read_only.
  Otherwise we raise :class:`SnapshotIsolationUnavailable` (HTTP 503).
* **Production correctness is the gate.** Existing
  ``@pytest.mark.django_db`` tests use the runner's outer
  transaction (READ COMMITTED) and so MUST be either (a) marked
  ``@pytest.mark.django_db(transaction=True)`` so the runner does
  not pre-open the outer transaction, or (b) skipped / rewritten.
  We do not weaken production behaviour to keep green tests.

Caveats:
========

* ``select_for_update`` does NOT create a snapshot — it only locks
  rows. Do not use it here.
* ``transaction.atomic`` alone runs at READ COMMITTED, which can
  show different rows in successive reads.
* Nested ``dashboard_snapshot`` blocks DO NOT change isolation. The
  inner SET TRANSACTION can only apply at the start of a transaction
  (the outer is already in READ COMMITTED) and would error out. The
  endpoint opens ONE snapshot before any selector runs; read models
  must NOT reopen or reconfigure it.
"""

from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Iterator

from django.db import ProgrammingError, connection, transaction


logger = logging.getLogger("plane.analytics.dashboard.snapshot")


class SnapshotIsolationUnavailable(Exception):
    """Raised when the dashboard cannot establish REPEATABLE READ.

    The view layer maps this to HTTP 503 with a clear
    ``SNAPSHOT_ISOLATION_UNAVAILABLE`` code so the caller knows the
    request cannot be served under the documented contract. The
    connection is rolled back; subsequent requests open a fresh
    connection that may succeed.
    """


@contextmanager
def dashboard_snapshot() -> Iterator[None]:
    """Open a REPEATABLE READ + READ ONLY transaction for the dashboard request.

    Behaviour:
    * If we are NOT already inside a transaction: open a fresh
      ``transaction.atomic()``, attempt to apply RR + READ ONLY,
      raise ``SnapshotIsolationUnavailable`` if it fails. The atomic
      context manager rolls back on exception.
    * If we ARE already inside a transaction (savepoint): inspect the
      current session's isolation + read_only. If both already match
      RR + read_only, yield inside the outer transaction (the SET
      TRANSACTION can only apply at the start of the transaction —
      which has already happened — so we trust the existing state).
      Otherwise raise ``SnapshotIsolationUnavailable``; do NOT
      silently fall back to READ COMMITTED.

    Caller contract: open this at the endpoint level, BEFORE
    ``resolve_dashboard_scope`` and BEFORE any payload builder runs.
    Do not nest it.
    """
    outer_atomic = connection.in_atomic_block

    if not outer_atomic:
        # Fresh transaction: we control isolation. Open BEGIN via
        # transaction.atomic(); SET TRANSACTION ISOLATION LEVEL
        # REPEATABLE READ READ ONLY before any other query.
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    # SET TRANSACTION only works BEFORE the first
                    # query in the transaction. transaction.atomic()
                    # has just sent BEGIN but not yet executed any
                    # user query, so this is the correct moment.
                    cursor.execute(
                        "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
                    )
                logger.debug(
                    "dashboard_snapshot: REPEATABLE READ READ ONLY applied "
                    "on fresh transaction"
                )
                yield
                # transaction.atomic commits on normal exit.
        except ProgrammingError as exc:
            logger.exception(
                "dashboard_snapshot: SET TRANSACTION failed (%s); "
                "connection rolled back; raising SnapshotIsolationUnavailable",
                exc,
            )
            raise SnapshotIsolationUnavailable(
                "Could not set REPEATABLE READ isolation; the database "
                "rejected SET TRANSACTION at the start of the request."
            ) from exc
        except Exception as exc:
            # Any other failure inside the atomic block: roll back
            # (transaction.atomic does this automatically on
            # exception) and surface the error to the caller. We do
            # NOT catch here to "fall back to READ COMMITTED" — that
            # would violate the spec.
            logger.exception(
                "dashboard_snapshot: error inside snapshot block; "
                "rolling back: %s",
                exc,
            )
            raise
        return

    # Nested call: caller already opened a transaction. We cannot
    # change isolation on a savepoint, so we either trust the outer
    # txn (if it's already RR + readonly) or refuse the request.
    actual_isolation, actual_read_only = _inspect_session_isolation()
    if _is_repeatable_read_isolation(actual_isolation) and actual_read_only:
        logger.debug(
            "dashboard_snapshot: nested call, outer transaction already "
            "REPEATABLE READ + READ ONLY; reusing"
        )
        yield
        return

    logger.error(
        "dashboard_snapshot: nested call refused: outer isolation=%s "
        "read_only=%s; cannot establish REPEATABLE READ on a savepoint. "
        "Caller must restructure so the dashboard endpoint is the top-level "
        "transaction owner.",
        actual_isolation,
        actual_read_only,
    )
    raise SnapshotIsolationUnavailable(
        f"Outer transaction isolation is {actual_isolation!r} "
        f"(read_only={actual_read_only}); cannot establish REPEATABLE READ "
        f"on a savepoint. The dashboard endpoint must be the top-level "
        f"transaction owner."
    )


def _is_repeatable_read_isolation(isolation: str | None) -> bool:
    """True when PostgreSQL reports REPEATABLE READ for the session."""
    if not isolation:
        return False
    normalized = isolation.strip().lower().replace(" ", "_").replace("-", "_")
    return normalized == "repeatable_read"


def _inspect_session_isolation() -> tuple[str | None, bool]:
    """Return ``(isolation_level, read_only)`` for the current session.

    Uses ``current_setting('transaction_isolation')`` and
    ``current_setting('transaction_read_only')``; returns
    ``(None, False)`` if the connection is not Postgres or the
    settings cannot be read.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SHOW transaction_isolation")
            row = cursor.fetchone()
            isolation = row[0] if row else None
            cursor.execute("SHOW transaction_read_only")
            row = cursor.fetchone()
            read_only = (row[0] if row else "off") == "on"
    except Exception as exc:  # noqa: BLE001
        logger.warning("dashboard_snapshot: could not inspect isolation: %s", exc)
        return None, False
    return isolation, read_only
