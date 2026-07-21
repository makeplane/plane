"""Transactional replay protection for strict Looper requests."""

from datetime import timedelta
from uuid import UUID

from django.db import IntegrityError, transaction
from django.utils import timezone

from plane.db.models import LooperLinkChallengeReplay, LooperRequestNonce

from .protocol import ProtocolError


REQUEST_NONCE_TTL = timedelta(minutes=10)


def _validate_nonce(nonce: bytes) -> bytes:
    if not isinstance(nonce, bytes) or len(nonce) != 16:
        raise ProtocolError("nonce must contain 16 bytes")
    return nonce


def consume_request_nonce(
    *,
    binding_id: UUID,
    key_revision: int,
    nonce: bytes,
    now=None,
) -> LooperRequestNonce:
    """Consume a nonce inside the caller's protected business transaction."""

    current_time = now or timezone.now()
    try:
        with transaction.atomic():
            return LooperRequestNonce.objects.create(
                binding_id=binding_id,
                key_revision=key_revision,
                nonce=_validate_nonce(nonce),
                expires_at=current_time + REQUEST_NONCE_TTL,
            )
    except IntegrityError as exc:
        raise ProtocolError("signed request nonce was already consumed") from exc


def consume_link_challenge(
    *,
    challenge_id: UUID,
    nonce: bytes,
    expires_at,
    now=None,
) -> LooperLinkChallengeReplay:
    """Consume the challenge in the same transaction that creates a binding."""

    current_time = now or timezone.now()
    if expires_at < current_time:
        raise ProtocolError("link challenge is expired")
    try:
        with transaction.atomic():
            return LooperLinkChallengeReplay.objects.create(
                challenge_id=challenge_id,
                nonce=_validate_nonce(nonce),
                expires_at=expires_at,
            )
    except IntegrityError as exc:
        raise ProtocolError("link challenge was already consumed") from exc


def purge_expired_replay_records(*, now=None) -> tuple[int, int]:
    current_time = now or timezone.now()
    # Replay rows are retention data, not recoverable business entities. Hard
    # delete them so their unconditional uniqueness constraints can be reused
    # after the safety window and the ledger cannot grow forever.
    request_count, _ = LooperRequestNonce.all_objects.filter(expires_at__lt=current_time).delete()
    challenge_count, _ = LooperLinkChallengeReplay.all_objects.filter(expires_at__lt=current_time).delete()
    return request_count, challenge_count
