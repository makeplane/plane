# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Append-only research audit writer.

``record_audit_event`` is the single write path for the research audit trail.
It stores summaries only - never report bodies - so the write stays cheap and
inside the caller's transaction.
"""

from plane.db.models import ResearchAuditEvent


class ResearchAuditAction:
    ORG_UNIT_CREATE = "org.unit.create"
    ORG_UNIT_UPDATE = "org.unit.update"
    ORG_UNIT_MOVE = "org.unit.move"
    ORG_UNIT_DELETE = "org.unit.delete"
    ORG_MEMBER_ADD = "org.member.add"
    ORG_MEMBER_UPDATE = "org.member.update"
    ORG_MEMBER_REMOVE = "org.member.remove"
    ORG_PI_TRANSFER = "org.pi.transfer"
    MENTOR_BINDING_CREATE = "org.mentor.bind"
    MENTOR_BINDING_DELETE = "org.mentor.unbind"


class ResearchResourceType:
    ORG_UNIT = "org_unit"
    ORG_UNIT_MEMBER = "org_unit_member"
    MENTOR_BINDING = "mentor_binding"


def _client_metadata(request):
    if request is None:
        return {"ip_address": None, "user_agent": None}
    ip_address = request.META.get("REMOTE_ADDR") or None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip() or ip_address
    user_agent = (request.META.get("HTTP_USER_AGENT") or "")[:255] or None
    return {"ip_address": ip_address, "user_agent": user_agent}


def record_audit_event(
    *,
    workspace,
    action,
    resource_type,
    resource_id=None,
    actor=None,
    org_unit=None,
    metadata=None,
    request=None,
):
    """Append a single audit event. Never raises on missing optional context."""
    if workspace is None:
        return None

    client = _client_metadata(request)
    if actor is None and request is not None:
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            actor = user

    return ResearchAuditEvent.objects.create(
        workspace=workspace,
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        org_unit=org_unit,
        metadata=metadata or {},
        ip_address=client["ip_address"],
        user_agent=client["user_agent"],
    )
