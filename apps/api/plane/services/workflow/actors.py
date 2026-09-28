# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow actor authorization — spec §6, §18.

The fork ships the deterministic resolvers required by the workflow
core (§12.1, §12.2, §12.3, §12.6 — the static / project-member /
project-role / portal-role resolvers) plus the placeholder resolvers
for the dynamic ones (§12.4, §12.5, §12.7 — requester manager,
department head, property member) that the approvals child (P1.3)
will plug into. The placeholder resolvers return ``None`` so callers
see a structured ``WORKFLOW_APPROVER_NOT_RESOLVED`` error rather
than a silent fall-through to "All" (§26.4 invariant).

The actor registry is the only place in the codebase allowed to
interpret ``WorkflowFlowActor.config`` (§7.6 invariant). Other code
modules must call ``resolve_actors`` / ``is_actor_authorized``.
"""

# Python imports
from typing import Iterable, Optional, Protocol

# Module imports
from plane.db.models import (
    ProjectMember,
    WorkflowFlowActor,
    WorkflowFlowActorType,
)
from plane.db.models.workflow import WorkflowFlowActorType as _ActorType

from .errors import WorkflowActorNotAuthorized, WorkflowApproverNotResolved


# ---------------------------------------------------------------------------
# Resolver protocol
# ---------------------------------------------------------------------------


class ActorResolver(Protocol):
    """Signature every actor resolver must satisfy.

    A resolver returns the set of user ids it can confirm as
    eligible. Returning an empty set is significant: callers map it
    to ``WORKFLOW_APPROVER_NOT_RESOLVED`` (§12.8, §26.4).
    """

    def __call__(
        self,
        *,
        flow,
        actor_config: dict,
        issue,
        actor_id: Optional[str],
    ) -> Iterable[str]:
        ...


# ---------------------------------------------------------------------------
# Concrete resolvers — V1 ships static / project-member / project-role /
# portal-role. The dynamic ones are wired but raise "not yet supported"
# so a misconfigured workflow cannot silently allow everyone.
# ---------------------------------------------------------------------------


def resolve_static_users(*, actor_config: dict, **kwargs) -> Iterable[str]:
    """§12.1 — explicit user id list."""
    user_ids = actor_config.get("user_ids") or []
    if not isinstance(user_ids, list):
        return []
    return [str(uid) for uid in user_ids if uid]


def resolve_all_project_members(*, flow, issue, **kwargs) -> Iterable[str]:
    """§12.2 — every active project member."""
    project_id = issue.project_id
    return list(
        ProjectMember.objects.filter(
            project_id=project_id,
            is_active=True,
        ).values_list("member_id", flat=True)
    )


def resolve_project_role(*, actor_config: dict, issue, **kwargs) -> Iterable[str]:
    """§12.3 — active project members with role ``>=`` configured role."""
    roles = actor_config.get("roles") or []
    if not isinstance(roles, list):
        return []
    project_id = issue.project_id
    return list(
        ProjectMember.objects.filter(
            project_id=project_id,
            is_active=True,
            role__in=[int(r) for r in roles],
        ).values_list("member_id", flat=True)
    )


def resolve_requester_manager(**kwargs) -> Iterable[str]:
    """§12.4 — requester's manager from the org provider.

    The fork does not yet ship an org chart provider (RD-461 P1.1).
    Resolving this actor must therefore fail loudly per §26.4 — we
    return an empty set so callers raise ``WORKFLOW_APPROVER_NOT_RESOLVED``.
    """
    return []


def resolve_department_head(**kwargs) -> Iterable[str]:
    """§12.5 — requester's department head from the org provider.

    See ``resolve_requester_manager`` for why this returns ``[]`` in V1.
    """
    return []


def resolve_portal_role(**kwargs) -> Iterable[str]:
    """§12.6 — domain role assignment.

    The fork does not yet ship a portal-role table; same rule as
    above — return ``[]`` so the failure is explicit.
    """
    return []


def resolve_property_member(**kwargs) -> Iterable[str]:
    """§12.7 — member-type custom property on the Work Item.

    Custom-property support is a later child; same rule as above.
    """
    return []


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------


_RESOLVERS = {
    WorkflowFlowActorType.STATIC_USERS: resolve_static_users,
    WorkflowFlowActorType.ALL_PROJECT_MEMBERS: resolve_all_project_members,
    WorkflowFlowActorType.PROJECT_ROLE: resolve_project_role,
    WorkflowFlowActorType.REQUESTER_MANAGER: resolve_requester_manager,
    WorkflowFlowActorType.DEPARTMENT_HEAD: resolve_department_head,
    WorkflowFlowActorType.PORTAL_ROLE: resolve_portal_role,
    WorkflowFlowActorType.PROPERTY_MEMBER: resolve_property_member,
}


def is_known_actor_type(actor_type: str) -> bool:
    return actor_type in _RESOLVERS


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def resolve_actors(
    *,
    flow,
    issue,
    actor_id: Optional[str] = None,
) -> set[str]:
    """Resolve the union of eligible user ids across the flow's actors.

    The flow's actors are unioned (§18 — a flow may declare multiple
    actors; the request is authorized if the actor is in the union).
    Empty union is mapped to ``WORKFLOW_APPROVER_NOT_RESOLVED`` (§12.8).
    """
    eligible: set[str] = set()
    actors = list(
        WorkflowFlowActor.objects.filter(flow=flow).order_by("sequence", "created_at")
    )
    if not actors:
        # An actor-less flow cannot be authorized; fail loudly so a
        # misconfigured workflow is caught at the first mutation.
        return set()

    for actor in actors:
        resolver = _RESOLVERS.get(actor.actor_type)
        if resolver is None:
            continue
        try:
            members = resolver(
                flow=flow,
                actor_config=actor.config or {},
                issue=issue,
                actor_id=actor_id,
            )
        except Exception:
            # §26.4 — resolver failure blocks the action. Returning an
            # empty set triggers WORKFLOW_APPROVER_NOT_RESOLVED up the
            # stack rather than silently allowing everyone.
            return set()
        for uid in members or []:
            eligible.add(str(uid))

    return eligible


def is_actor_authorized(
    *,
    flow,
    issue,
    actor_id: Optional[str],
) -> bool:
    """Return ``True`` iff ``actor_id`` is in the union of eligible users.

    An empty eligible set is always treated as "not authorized" so
    a misconfigured flow cannot accidentally permit everyone
    (§26.4). The detailed error mapping lives in
    ``authorize_actor``.
    """
    if actor_id is None:
        return False
    eligible = resolve_actors(flow=flow, issue=issue, actor_id=actor_id)
    return str(actor_id) in eligible


def authorize_actor(
    *,
    flow,
    issue,
    actor_id: Optional[str],
    empty_set_message: Optional[str] = None,
) -> None:
    """Raise ``WorkflowActorNotAuthorized`` if the actor is not eligible.

    Distinct from ``is_actor_authorized`` so callers get a structured
    error code without having to construct the message themselves.
    """
    eligible = resolve_actors(flow=flow, issue=issue, actor_id=actor_id)
    if not eligible:
        # §12.8 — empty resolver result must NOT silently auto-allow.
        raise WorkflowApproverNotResolved(
            detail=empty_set_message
            or "Workflow flow has no resolvable actors for this work item.",
        )
    if actor_id is None or str(actor_id) not in eligible:
        raise WorkflowActorNotAuthorized()
