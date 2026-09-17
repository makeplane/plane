# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Report state machine and ACL projection."""

from django.utils import timezone

from plane.db.models import ReportAccessGrant
from plane.research.utils.acl import ResearchResource

# Only the transitions drawn in the PRD state diagram are allowed (P0-RPT-06).
STATE_TRANSITIONS = {
    "DRAFT": {"SUBMITTED"},
    "SUBMITTED": {"ACCEPTED", "NEEDS_REVISION"},
    "NEEDS_REVISION": {"DRAFT", "SUBMITTED"},
    "ACCEPTED": set(),
}

EDITABLE_STATES = {"DRAFT", "NEEDS_REVISION"}


def can_transition(from_status, to_status) -> bool:
    return to_status in STATE_TRANSITIONS.get(from_status, set())


def is_editable(report) -> bool:
    return report.status in EDITABLE_STATES


def active_grants(report):
    """Custom grants that are still valid, projected for the ACL service."""
    now = timezone.now()
    grants = []
    prefetched = getattr(report, "_prefetched_objects_cache", {}).get("access_grants")
    grants_source = prefetched if prefetched is not None else ReportAccessGrant.objects.filter(report=report)
    for grant in grants_source:
        if grant.is_revoked:
            continue
        if grant.expires_at and grant.expires_at <= now:
            continue
        grants.append(
            {
                "grantee_user": str(grant.grantee_user_id) if grant.grantee_user_id else None,
                "grantee_org_unit": str(grant.grantee_org_unit_id) if grant.grantee_org_unit_id else None,
            }
        )
    return grants


def report_resource(report) -> ResearchResource:
    return ResearchResource(
        kind="report",
        workspace_id=report.workspace_id,
        owner_id=report.owner_id,
        org_unit_id=report.org_unit_id,
        visibility=report.visibility,
        state=report.status,
        # A returned report has a new private revision while readers receive the
        # last immutable snapshot. Before the first submission it is all draft.
        is_draft=report.submitted_at is None,
        grants=active_grants(report),
    )
