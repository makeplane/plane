"""Plane-authoritative Node binding creation and projection."""

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone as datetime_timezone
from typing import Any
from uuid import UUID

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from django.db import transaction

from plane.db.models import LooperNodeBinding, LooperNodeKey, ProjectMember

from .protocol import (
    LINK_CHALLENGE_PROFILE,
    LINK_PROOF_PROFILE,
    ProtocolError,
    decode_envelope,
    decode_link_challenge,
    decode_link_proof,
    decode_link_request,
    domain_digest,
    verify_envelope,
)
from .replay import consume_link_challenge
from .security import TrustKeyRing


@dataclass(frozen=True)
class VerifiedLinkRequest:
    network_id: str
    node_id: str
    challenge_id: UUID
    nonce: bytes
    expires_at_ms: int
    public_key: bytes


def verify_link_request(
    raw_body: bytes,
    *,
    trust_key_ring: TrustKeyRing,
    now_ms: int,
    expected_network_id: str,
    workspace_id: UUID,
    project_id: UUID,
    member_id: UUID,
) -> VerifiedLinkRequest:
    challenge_envelope, proof_envelope = decode_link_request(raw_body)
    untrusted_challenge_payload = decode_envelope(challenge_envelope)[3]
    untrusted_challenge = decode_link_challenge(untrusted_challenge_payload)
    untrusted_proof_payload = decode_envelope(proof_envelope)[3]
    untrusted_proof = decode_link_proof(untrusted_proof_payload)
    public_key_bytes = untrusted_proof[6]

    challenge = trust_key_ring.verify_link_challenge(
        challenge_envelope,
        now_ms=now_ms,
        expected_audience=f"plane:{workspace_id}",
        expected_network_id=expected_network_id,
        expected_node_id=untrusted_challenge[3],
        expected_public_key_sha256=hashlib.sha256(public_key_bytes).digest(),
    )
    public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
    proof_payload = verify_envelope(
        public_key,
        profile=LINK_PROOF_PROFILE,
        envelope=proof_envelope,
        expected_key_revision=0,
    )
    proof = decode_link_proof(proof_payload)
    if proof[2] != domain_digest(LINK_CHALLENGE_PROFILE, untrusted_challenge_payload):
        raise ProtocolError("link proof challenge digest mismatch")
    if UUID(bytes=proof[3]) != workspace_id or UUID(bytes=proof[4]) != project_id:
        raise ProtocolError("link proof workspace or project mismatch")
    if UUID(bytes=proof[5]) != member_id:
        raise ProtocolError("link proof member does not match the Plane session")
    return VerifiedLinkRequest(
        network_id=challenge[2],
        node_id=challenge[3],
        challenge_id=UUID(bytes=challenge[6]),
        nonce=challenge[7],
        expires_at_ms=challenge[9],
        public_key=public_key_bytes,
    )


@transaction.atomic
def create_pending_binding(*, project, member, verified: VerifiedLinkRequest, now=None) -> LooperNodeBinding:
    return create_binding(project=project, member=member, verified=verified, state="pending", now=now)


@transaction.atomic
def create_active_binding(
    *, project, member, verified: VerifiedLinkRequest, node_name="", now=None
) -> LooperNodeBinding:
    return create_binding(
        project=project,
        member=member,
        verified=verified,
        state="active",
        node_name=node_name,
        now=now,
    )


def create_binding(
    *, project, member, verified: VerifiedLinkRequest, state, node_name="", now=None
) -> LooperNodeBinding:
    if not ProjectMember.objects.select_for_update().filter(project=project, member=member, is_active=True).exists():
        raise ProtocolError("binding owner is not an active project member")
    expires_at = datetime.fromtimestamp(verified.expires_at_ms / 1000, tz=datetime_timezone.utc)
    consume_link_challenge(
        challenge_id=verified.challenge_id,
        nonce=verified.nonce,
        expires_at=expires_at,
        now=now,
    )
    binding = LooperNodeBinding.objects.create(
        project=project,
        member=member,
        node_id=verified.node_id,
        node_name_snapshot=node_name.strip()[:255] or verified.node_id,
        allowed_roles=["planner", "worker"] if state == "active" else [],
        state=state,
    )
    LooperNodeKey.objects.create(
        project=project,
        binding=binding,
        key_revision=1,
        public_key=verified.public_key,
        state="active",
    )
    return binding


def binding_payload(binding: LooperNodeBinding) -> dict[str, Any]:
    return {
        "id": str(binding.id),
        "member_id": str(binding.member_id),
        "node_id": binding.node_id,
        "node_name": binding.node_name_snapshot,
        "allowed_roles": binding.allowed_roles,
        "allow_offline_queue": binding.allow_offline_queue,
        "state": binding.state,
        "revision": binding.revision,
        "approved_by_id": str(binding.approved_by_id) if binding.approved_by_id else None,
        "approved_at": binding.approved_at,
        "created_at": binding.created_at,
        "updated_at": binding.updated_at,
        "live_status": "unavailable",
    }
