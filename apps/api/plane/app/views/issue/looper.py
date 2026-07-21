# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectEntityPermission, ROLE, allow_permission
from plane.db.models import Issue, LooperDispatch

from .. import BaseAPIView


PHASES = (
    "research",
    "role_decisions",
    "technical_spec",
    "implementation",
    "pull_request",
    "qa",
    "complete",
)


def _member_payload(member):
    if member is None:
        return None
    display_name = member.display_name.strip() or " ".join(
        part for part in (member.first_name.strip(), member.last_name.strip()) if part
    )
    return {
        "id": str(member.id),
        "display_name": display_name or member.email or str(member.id),
        "avatar": member.avatar_url,
    }


def _derived_phase(dispatch):
    if dispatch.state == "completed":
        return "complete"
    if dispatch.wait_kind == "role_decision":
        return "role_decisions"
    if dispatch.wait_kind == "technical_spec_approval":
        return "technical_spec"
    if dispatch.wait_kind == "qa":
        return "qa"
    if dispatch.active_role == "worker":
        return "implementation"
    return "research"


def _phase_payload(current_phase, dispatch_state):
    current_index = PHASES.index(current_phase) if current_phase in PHASES else 0
    phases = []
    for index, phase in enumerate(PHASES):
        if dispatch_state == "completed" or index < current_index:
            phase_status = "completed"
        elif index == current_index:
            phase_status = "current"
        else:
            phase_status = "pending"
        phases.append({"key": phase, "status": phase_status})
    return phases


def build_looper_summary(dispatch):
    try:
        snapshot = dispatch.collaboration_snapshot
    except ObjectDoesNotExist:
        snapshot = None

    current_phase = snapshot.phase if snapshot else _derived_phase(dispatch)
    role_members = {
        "product": dispatch.product_member_snapshot,
        "design": dispatch.design_member_snapshot,
        "engineering": dispatch.owner_member,
        "qa": dispatch.qa_member_snapshot,
    }
    requests = list(dispatch.role_requests.select_related("eligible_member").order_by("created_at"))
    roles = []
    for role in role_members:
        role_requests = [request for request in requests if request.role == role]
        open_requests = [request for request in role_requests if request.status == "open"]
        answered_requests = [request for request in role_requests if request.status == "answered"]
        roles.append(
            {
                "role": role,
                "member": _member_payload(role_members[role]),
                "open_count": len(open_requests),
                "answered_count": len(answered_requests),
                "total_count": len(role_requests),
                "status": "waiting" if open_requests else "completed" if role_requests else "pending",
                "current_question": open_requests[0].question_summary if open_requests else None,
            }
        )

    artifacts = [
        {
            "id": str(artifact.id),
            "type": artifact.type,
            "title": artifact.title,
            "url": artifact.url,
            "source_revision_id": artifact.source_revision_id,
        }
        for artifact in dispatch.artifacts.order_by("created_at")
    ]
    recent_events = [
        {
            "id": str(event.id),
            "version": event.event_version,
            "type": event.event_type,
            "phase": event.phase,
            "role": event.role or None,
            "actor": _member_payload(event.actor_member),
            "occurred_at": event.occurred_at,
        }
        for event in dispatch.collaboration_events.select_related("actor_member").order_by("-event_version")[:3]
    ]
    waiting_role = (
        snapshot.waiting_role
        if snapshot
        else next(
            (role["role"] for role in roles if role["status"] == "waiting"),
            None,
        )
    )
    current_question = next(
        (role["current_question"] for role in roles if role["current_question"]),
        None,
    )

    return {
        "visibility": "visible",
        "protocol": "strict_v1",
        "read_only": True,
        "permissions": {
            "can_view": True,
            "can_dispatch": False,
            "can_stop": False,
            "can_release": False,
        },
        "dispatch": {
            "id": str(dispatch.id),
            "revision": dispatch.revision,
            "state_version": dispatch.state_version,
            "role_policy_revision": dispatch.role_policy_revision,
            "state": dispatch.state,
            "health": dispatch.health,
            "requested_mode": dispatch.requested_mode,
            "active_role": dispatch.active_role,
            "owner": _member_payload(dispatch.owner_member),
            "node": {
                "id": dispatch.node_id,
                "name": dispatch.node_name_snapshot,
                "live_status": "unavailable",
                "last_ack_at": dispatch.last_node_ack_at,
            },
            "created_at": dispatch.created_at,
            "updated_at": dispatch.updated_at,
        },
        "current_phase": current_phase,
        "waiting_role": waiting_role,
        "current_question": current_question,
        "phases": _phase_payload(current_phase, dispatch.state),
        "roles": roles,
        "artifacts": artifacts,
        "recent_events": recent_events,
        "snapshot_version": snapshot.snapshot_version if snapshot else 0,
        "available_actions": [],
    }


class IssueLooperSummaryEndpoint(BaseAPIView):
    """Read-only S1 projection for the Plane work-item Looper panel."""

    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue = get_object_or_404(
            Issue.objects.filter(
                id=issue_id,
                project_id=project_id,
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
        )
        dispatch = (
            LooperDispatch.objects.filter(issue=issue)
            .select_related(
                "owner_member",
                "product_member_snapshot",
                "design_member_snapshot",
                "qa_member_snapshot",
            )
            .order_by("-created_at")
            .first()
        )
        if dispatch is None:
            return Response(
                {
                    "visibility": "hidden",
                    "protocol": None,
                    "read_only": True,
                    "permissions": {
                        "can_view": True,
                        "can_dispatch": False,
                        "can_stop": False,
                        "can_release": False,
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(build_looper_summary(dispatch), status=status.HTTP_200_OK)
