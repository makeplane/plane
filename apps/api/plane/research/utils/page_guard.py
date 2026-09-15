# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Guard that keeps the upstream Page API from becoming an ACL bypass.

The lookup is intentionally cheap: plain pages answer ``None`` immediately, so
upstream behaviour is unchanged (P0-ACL-08, P0-COMPAT-01).
"""


def get_report_for_page(page):
    """Return the report whose body is this page, or ``None``."""
    if page is None:
        return None
    cached = getattr(page, "_research_report_cache", None)
    if cached is not None:
        return cached if cached != "none" else None

    from plane.db.models import PeriodicReport

    report = PeriodicReport.objects.filter(page_id=page.id).first()
    page._research_report_cache = report if report is not None else "none"
    return report


def page_mutation_error_code(page, action):
    """Return an error code when the action must be refused, else ``None``.

    - updates: a submitted or accepted report body is read only
    - deletes: the report body is never deleted through the page endpoint
    """
    report = get_report_for_page(page)
    if report is None:
        return None

    if action == "delete":
        return "report_read_only"
    if report.status in ("SUBMITTED", "ACCEPTED"):
        return "report_read_only"
    return None
