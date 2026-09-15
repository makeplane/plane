# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Guard that keeps the upstream Page API from becoming an ACL bypass.

Two research object types own a Page body: periodic reports (P0) and stage
materials (P1). Both lookups are intentionally cheap and lazily cached on the
page instance: a plain page answers ``None`` without an extra query, so
upstream behaviour is unchanged (P0-ACL-08, P0-COMPAT-01, P1-OPN-06, T-04).
"""

# Stage statuses in which a material body may be edited (§3.4).
EDITABLE_STAGE_STATUSES = ("IN_PROGRESS", "NEEDS_REVISION")


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
    if report is not None:
        if action == "delete":
            return "report_read_only"
        if report.status in ("SUBMITTED", "ACCEPTED"):
            return "report_read_only"
        return None

    material = get_material_for_page(page)
    if material is not None:
        if action == "delete":
            return "stage_material_read_only"
        if material.stage_instance.status not in EDITABLE_STAGE_STATUSES:
            return "stage_material_read_only"
    return None


def get_material_for_page(page):
    """Return the stage material whose body is this page, or ``None``."""
    if page is None:
        return None
    cached = getattr(page, "_research_material_cache", None)
    if cached is not None:
        return cached if cached != "none" else None

    from plane.db.models import StageMaterial

    material = (
        StageMaterial.objects.filter(page_id=page.id, deleted_at__isnull=True)
        .select_related("stage_instance")
        .first()
    )
    page._research_material_cache = material if material is not None else "none"
    return material


def page_mutation_error_message(error_code):
    """Readable message for a refused page mutation (P0 string kept verbatim)."""
    if error_code == "stage_material_read_only":
        return "This page holds a stage material body and is read only in the current stage state."
    return "Submitted reports are read only."
