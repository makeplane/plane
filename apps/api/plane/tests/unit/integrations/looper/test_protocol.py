import base64
import hashlib
import json
from pathlib import Path
from uuid import UUID

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from plane.integrations.looper.protocol import (
    LINK_CHALLENGE_PROFILE,
    LINK_PROOF_PROFILE,
    NODE_REQUEST_PROFILE,
    ProtocolError,
    b64url_encode,
    canonicalize_path,
    canonicalize_query,
    decode_canonical_cbor,
    decode_link_challenge,
    decode_link_request,
    decode_link_proof,
    decode_node_request,
    domain_digest,
    encode_envelope,
    encode_link_challenge,
    encode_link_request,
    encode_link_proof,
    encode_node_request,
    parse_signature_header,
    sign_envelope,
    verify_envelope,
)


FIXTURE_PATH = Path(__file__).parents[3] / "fixtures" / "looper" / "strict_protocol_v1.json"


@pytest.fixture(scope="module")
def vectors():
    return json.loads(FIXTURE_PATH.read_text())


def b64(value: str) -> bytes:
    return base64.b64decode(value)


def private_key(value: dict) -> Ed25519PrivateKey:
    return Ed25519PrivateKey.from_private_bytes(b64(value["private_seed_b64"]))


def public_key(value: dict) -> Ed25519PublicKey:
    return Ed25519PublicKey.from_public_bytes(b64(value["public_key_b64"]))


@pytest.mark.unit
def test_link_challenge_matches_normative_vector(vectors):
    item = vectors["challenge"]
    trust_private = private_key(vectors["trust"])
    trust_public = public_key(vectors["trust"])
    assert trust_private.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw) == b64(
        vectors["trust"]["public_key_b64"]
    )

    payload = encode_link_challenge(
        network_id=item["network_id"],
        node_id=item["node_id"],
        public_key_sha256=b64(item["public_key_sha256_b64"]),
        audience=item["audience"],
        challenge_id=item["challenge_id"],
        nonce=b64(item["nonce_b64"]),
        issued_at_ms=item["issued_at_ms"],
        expires_at_ms=item["expires_at_ms"],
    )

    assert payload == b64(item["payload_cbor_b64"])
    assert domain_digest(LINK_CHALLENGE_PROFILE, payload) == b64(item["digest_b64"])
    assert trust_private.sign(domain_digest(LINK_CHALLENGE_PROFILE, payload)) == b64(item["signature_b64"])
    envelope = sign_envelope(
        trust_private,
        profile=LINK_CHALLENGE_PROFILE,
        key_revision=vectors["trust"]["key_revision"],
        payload=payload,
    )
    assert envelope == b64(item["envelope_cbor_b64"])
    assert b64url_encode(envelope) == item["envelope_base64url"]
    assert (
        verify_envelope(
            trust_public,
            profile=LINK_CHALLENGE_PROFILE,
            envelope=envelope,
            expected_key_revision=7,
        )
        == payload
    )
    assert decode_link_challenge(payload)[3] == item["node_id"]


@pytest.mark.unit
def test_link_proof_and_link_request_match_normative_vector(vectors):
    challenge = vectors["challenge"]
    item = vectors["proof"]
    node_private = private_key(vectors["node"])
    node_public = public_key(vectors["node"])
    public_bytes = node_public.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)

    payload = encode_link_proof(
        challenge_sha256=b64(challenge["digest_b64"]),
        plane_workspace_id=item["plane_workspace_id"],
        plane_project_id=item["plane_project_id"],
        member_id=item["member_id"],
        public_key=public_bytes,
    )
    assert payload == b64(item["payload_cbor_b64"])
    assert domain_digest(LINK_PROOF_PROFILE, payload) == b64(item["digest_b64"])
    assert node_private.sign(domain_digest(LINK_PROOF_PROFILE, payload)) == b64(item["signature_b64"])
    proof_envelope = sign_envelope(node_private, profile=LINK_PROOF_PROFILE, key_revision=0, payload=payload)
    assert proof_envelope == b64(item["envelope_cbor_b64"])
    assert (
        verify_envelope(
            node_public,
            profile=LINK_PROOF_PROFILE,
            envelope=proof_envelope,
            expected_key_revision=0,
        )
        == payload
    )
    assert decode_link_proof(payload)[7] == "Ed25519"

    challenge_envelope = b64(challenge["envelope_cbor_b64"])
    link_request = encode_link_request(
        challenge_envelope=challenge_envelope,
        proof_envelope=proof_envelope,
    )
    assert link_request == b64(vectors["link_request_cbor_b64"])
    assert decode_link_request(link_request) == (challenge_envelope, proof_envelope)


@pytest.mark.unit
@pytest.mark.parametrize("index", [0, 1])
def test_node_request_matches_normative_vectors(vectors, index):
    item = vectors["node_requests"][index]
    body = b64(item["raw_body_b64"])
    dispatch_id = item["dispatch_id"]
    attempt_id = item["execution_attempt_id"]
    node_private = private_key(vectors["node"])
    node_public = public_key(vectors["node"])

    payload = encode_node_request(
        method=item["method"],
        path=item["raw_path"],
        query=item["raw_query"],
        body_sha256=hashlib.sha256(body).digest(),
        binding_id=item["binding_id"],
        key_revision=item["key_revision"],
        dispatch_id=dispatch_id,
        dispatch_revision=item["dispatch_revision"],
        state_version=item["state_version"],
        execution_attempt_id=attempt_id,
        fencing_token=item["fencing_token"],
        timestamp_ms=item["timestamp_ms"],
        nonce=b64(item["nonce_b64"]),
    )

    assert canonicalize_path(item["raw_path"]) == item["canonical_path"]
    assert canonicalize_query(item["raw_query"]) == item["canonical_query"]
    assert payload == b64(item["payload_cbor_b64"])
    assert hashlib.sha256(body).digest() == b64(item["body_sha256_b64"])
    digest = domain_digest(NODE_REQUEST_PROFILE, payload)
    assert digest == b64(item["digest_b64"])
    assert node_private.sign(digest) == b64(item["signature_b64"])
    node_public.verify(b64(item["signature_b64"]), digest)
    decoded = decode_node_request(payload)
    assert decoded[2] == item["method"]
    assert decoded[3] == item["canonical_path"]
    assert decoded[4] == item["canonical_query"]
    assert (decoded[8] is None) == (dispatch_id is None)

    header = parse_signature_header(item["signature_header"])
    assert header["binding_id"] == UUID(item["binding_id"])
    assert header["key_revision"] == item["key_revision"]
    assert header["timestamp_ms"] == item["timestamp_ms"]
    assert header["nonce"] == b64(item["nonce_b64"])
    assert header["signature"] == b64(item["signature_b64"])


@pytest.mark.unit
def test_tamper_wrong_revision_and_ed25519ph_fail_closed(vectors):
    item = vectors["challenge"]
    envelope = b64(item["envelope_cbor_b64"])
    trust_public = public_key(vectors["trust"])

    with pytest.raises(ProtocolError, match="unexpected key revision"):
        verify_envelope(
            trust_public,
            profile=LINK_CHALLENGE_PROFILE,
            envelope=envelope,
            expected_key_revision=8,
        )

    payload = bytearray(b64(item["payload_cbor_b64"]))
    payload[-1] ^= 1
    tampered = encode_envelope(
        key_revision=7,
        payload=bytes(payload),
        signature=b64(item["signature_b64"]),
    )
    with pytest.raises(ProtocolError, match="invalid Ed25519 signature"):
        verify_envelope(trust_public, profile=LINK_CHALLENGE_PROFILE, envelope=tampered)

    ph_envelope = encode_envelope(
        key_revision=7,
        payload=b64(item["payload_cbor_b64"]),
        signature=b64(item["ed25519ph_signature_b64"]),
    )
    with pytest.raises(ProtocolError, match="invalid Ed25519 signature"):
        verify_envelope(trust_public, profile=LINK_CHALLENGE_PROFILE, envelope=ph_envelope)


@pytest.mark.unit
def test_non_deterministic_or_ambiguous_inputs_are_rejected(vectors):
    challenge = b64(vectors["challenge"]["payload_cbor_b64"])
    assert challenge[0] == 0xA9
    with pytest.raises(ProtocolError, match="not deterministic"):
        decode_canonical_cbor(b"\xb8\x09" + challenge[1:])
    with pytest.raises(ProtocolError):
        decode_canonical_cbor(b"\xa2\x01\x01\x01\x01")
    with pytest.raises(ProtocolError, match="encoded path separators"):
        canonicalize_path("/safe%2Fescape")
    with pytest.raises(ProtocolError, match="contain '='"):
        canonicalize_query("cursor")
    with pytest.raises(ProtocolError, match="duplicate"):
        parse_signature_header(
            "v=1; v=1; key=55555555-6666-4777-8888-999999999999:2; ts=1; "
            "nonce=AAECAwQFBgcICQoLDA0ODw; "
            "sig=itFYPHmdt4SnA7kBP_YXy5R6SCHK_CyyeMJrqIVQhePn_Fnpl3k1H7sN4xpQzz8-AqfflNrw9fI_KtBjPZZuBA"
        )
