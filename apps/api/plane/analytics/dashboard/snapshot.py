# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Read-snapshot helper for the Team Operations Dashboard.

The overview, attention, workload, projects and timeline endpoints all
return a coordinated view of the workspace. Spec §9.4 ("Snapshot
sections in one response must be consistent") requires the per-request
sections to share the same MVCC snapshot so a row cannot appear in the
KPI totals but vanish from the items drilldown.

Implementation
==============

We open a single ``transaction.atomic()`` block at the endpoint scope
and issue ``SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY``
*immediately after* BEGIN, before any SELECT runs. PostgreSQL pins the
MVCC snapshot at the first read inside the transaction; subsequent
SELECTs in the same transaction see the same data even if another writer
commits.

Important caveats
=================

* ``select_for_update`` does **not** create a snapshot — it only locks
  rows. Do not use it here.
* ``transaction.atomic`` alone runs at the default isolation
  (READ COMMITTED), which can show different rows in successive reads.
* Nested ``dashboard_snapshot`` blocks DO NOT change isolation. The
  inner SET TRANSACTION can only apply at the start of a transaction
  (the outer is already in READ COMMITTED) and would error out. The
  endpoint opens ONE snapshot before any selector runs; read models
  must NOT reopen or reconfigure it.
* Django's test runner wraps each ``@pytest.mark.django_db`` test in
  its own transaction. ``SET TRANSACTION ISOLATION LEVEL`` cannot apply
  inside that wrapper — the snapshot degrades to READ COMMITTED and
  the request will see cross-section inconsistency. Tests that need
  real RR isolation must use ``@pytest.mark.django_db(transaction=True)``
  so the test runner does not pre-open a transaction.

The :func:`dashboard_snapshot` context manager wraps the request body
in a snapshot transaction. Sections that need a *shared* snapshot use
it; standalone selectors (e.g. single-issue items drilldown) do not.
"""

from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Iterator

from django.db import connection, transaction


logger = logging.getLogger("plane.analytics.dashboard.snapshot")


@contextmanager
def dashboard_snapshot() -> Iterator[None]:
    """Open a REPEATABLE READ + READ ONLY transaction for the dashboard request.

    PostgreSQL only allows ``SET TRANSACTION ISOLATION LEVEL`` at the
    start of a transaction. We:

    1. Open ``transaction.atomic()`` (BEGIN on the connection).
    2. Immediately try ``SET TRANSACTION ISOLATION LEVEL REPEATABLE READ
       READ ONLY`` BEFORE any query runs through the connection.
    3. If the SET succeeds, every SELECT through Django inside the
       block sees the same MVCC snapshot. After the block, ``atomic``
       commits and isolation returns to whatever the caller had.
    4. If the SET fails (e.g. we're inside the Django test-runner's
       outer transaction, which has already executed queries, or a
       nested atomic created a savepoint), we log a warning and yield
       anyway — the block still runs, but on READ COMMITTED. The view
       itself never raises; the contract just degrades.

    Caller contract: open this at the endpoint level, BEFORE
    ``resolve_dashboard_scope`` and BEFORE any payload builder runs.
    Do not nest it.
    """
    # transaction.atomic() may enter savepoint mode if there's an outer
    # atomic block (e.g. the test runner's per-test transaction). In that
    # case SET TRANSACTION will fail and we degrade.
    outer_atomic = connection.in_atomic_block
    isolation_applied = False

    with transaction.atomic():
        if not outer_atomic:
            # First BEGIN on this connection — we can attempt SET.
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
                    )
                isolation_applied = True
                logger.debug("dashboard_snapshot: REPEATABLE READ READ ONLY applied")
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "dashboard_snapshot: could not set REPEATABLE READ "
                    "(%s: %s); request will use caller isolation",
                    type(exc).__name__, exc,
                )
        else:
            logger.debug(
                "dashboard_snapshot: already inside an outer transaction; "
                "snapshot degraded (no isolation change possible inside a savepoint)"
            )
        try:
            yield
        finally:
            if isolation_applied:
                logger.debug(
                    "dashboard_snapshot: exiting with REPEATABLE READ active "
                    "(commit will release the snapshot)"
                )
            else:
                logger.debug(
                    "dashboard_snapshot: exiting without isolation guarantee"
                )
