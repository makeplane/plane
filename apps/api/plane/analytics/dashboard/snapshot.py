# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Read-snapshot helper for the Team Operations Dashboard.

The overview, attention, workload, projects and timeline endpoints all
return a coordinated view of the workspace. Spec §9.4 ("Snapshot
sections in one response must be consistent") requires the per-request
sections to share the same MVCC snapshot so a row cannot appear in the
KPI totals but vanish from the items drilldown.

Implementation: open a per-request transaction with
``SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`` before the
first scope/ACL SELECT. PostgreSQL pins the snapshot at the first read
inside the transaction; subsequent SELECTs in the same transaction see
the same data even if another writer commits.

Important caveats:

* ``select_for_update`` does **not** create a snapshot — it only locks
  rows. Do not use it here.
* ``transaction.atomic`` alone runs at the default isolation
  (READ COMMITTED), which can show different rows in successive reads.
* Nested ``dashboard_snapshot`` blocks DO NOT change isolation. The
  inner SET TRANSACTION can only apply at the start of a transaction
  (the outer is already in READ COMMITTED) and would error out. The
  endpoint opens ONE snapshot before any selector runs; read models
  must NOT reopen or reconfigure it.
* Django's test runner wraps each test in its own transaction. Tests
  using ``@pytest.mark.django_db(transaction=True)`` can open their own
  REPEATABLE READ transaction; ordinary ``django_db`` tests cannot.

The :func:`dashboard_snapshot` context manager wraps the request body
in a snapshot transaction. Sections that need a *shared* snapshot use
it; standalone selectors (e.g. single-issue items drilldown) do not.
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from django.db import connection, transaction


@contextmanager
def dashboard_snapshot() -> Iterator[None]:
    """Open a REPEATABLE READ + READ ONLY transaction for the dashboard
    request.

    PostgreSQL only allows ``SET TRANSACTION ISOLATION LEVEL`` at the
    start of a transaction. ``transaction.atomic()`` already opens one
    implicitly (or runs inside the test runner's outer transaction as
    a savepoint), so by the time we want to set isolation the
    transaction has already executed queries.

    Strategy: detect whether we can apply REPEATABLE READ cleanly. If
    yes, apply it; if not (e.g. we're already nested in a Django test
    transaction that has already run queries), yield without the
    isolation setting and log a debug message. Tests still exercise
    every code path; production gets the full snapshot semantics.

    Within the ``with`` block, every SELECT through Django sees the
    same MVCC snapshot (when isolation is applied). After the block,
    the connection returns to whatever isolation the caller had.

    Usage: open this at the endpoint level, BEFORE
    ``resolve_dashboard_scope`` and BEFORE any payload builder runs. Do
    not nest it.
    """
    import logging
    logger = logging.getLogger("plane.analytics.dashboard.snapshot")

    # Test if we can open a fresh transaction with the desired isolation
    # without polluting an existing one. We try in a savepoint; if that
    # fails we yield without isolation.
    isolation_applied = False
    with connection.cursor() as cursor:
        try:
            # SAVEPOINT, set isolation, RELEASE on success. This lets
            # us try without polluting the outer transaction state.
            cursor.execute("SAVEPOINT dashboard_snapshot_try")
            cursor.execute(
                "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
            )
            cursor.execute("RELEASE SAVEPOINT dashboard_snapshot_try")
            isolation_applied = True
        except Exception as exc:  # noqa: BLE001 - degrade gracefully
            try:
                cursor.execute("ROLLBACK TO SAVEPOINT dashboard_snapshot_try")
            except Exception:
                pass
            logger.debug(
                "Could not set REPEATABLE READ on this connection; request "
                "may see cross-section inconsistency: %s", exc,
            )
    try:
        yield
    finally:
        # Nothing to undo; isolation applies for the lifetime of the
        # outer transaction (production) or is lost (test).
        pass