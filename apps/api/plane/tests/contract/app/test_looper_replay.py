from datetime import timedelta
from uuid import uuid4

import pytest
from django.utils import timezone

from plane.db.models import LooperLinkChallengeReplay, LooperRequestNonce
from plane.integrations.looper.protocol import ProtocolError
from plane.integrations.looper.replay import (
    consume_link_challenge,
    consume_request_nonce,
    purge_expired_replay_records,
)


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_request_nonce_is_consumed_once():
    binding_id = uuid4()
    nonce = bytes(range(16))

    consume_request_nonce(binding_id=binding_id, key_revision=2, nonce=nonce)

    with pytest.raises(ProtocolError, match="already consumed"):
        consume_request_nonce(binding_id=binding_id, key_revision=2, nonce=nonce)
    assert LooperRequestNonce.objects.filter(binding_id=binding_id).count() == 1


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_link_challenge_id_is_consumed_once_even_if_nonce_changes():
    challenge_id = uuid4()
    expires_at = timezone.now() + timedelta(minutes=2)

    consume_link_challenge(
        challenge_id=challenge_id,
        nonce=b"a" * 16,
        expires_at=expires_at,
    )

    with pytest.raises(ProtocolError, match="already consumed"):
        consume_link_challenge(
            challenge_id=challenge_id,
            nonce=b"b" * 16,
            expires_at=expires_at,
        )
    assert LooperLinkChallengeReplay.objects.filter(challenge_id=challenge_id).count() == 1


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_expired_challenge_is_rejected_and_cleanup_removes_only_expired_records():
    now = timezone.now()
    with pytest.raises(ProtocolError, match="expired"):
        consume_link_challenge(
            challenge_id=uuid4(),
            nonce=b"a" * 16,
            expires_at=now - timedelta(seconds=1),
            now=now,
        )

    expired = LooperRequestNonce.objects.create(
        binding_id=uuid4(),
        key_revision=1,
        nonce=b"c" * 16,
        expires_at=now - timedelta(seconds=1),
    )
    active = LooperRequestNonce.objects.create(
        binding_id=uuid4(),
        key_revision=1,
        nonce=b"d" * 16,
        expires_at=now + timedelta(minutes=1),
    )

    request_count, challenge_count = purge_expired_replay_records(now=now)

    assert request_count == 1
    assert challenge_count == 0
    assert not LooperRequestNonce.objects.filter(id=expired.id).exists()
    assert LooperRequestNonce.objects.filter(id=active.id).exists()
