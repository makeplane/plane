import base64
import hashlib
import json
from pathlib import Path
from uuid import UUID

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from plane.integrations.looper.protocol import ProtocolError
from plane.integrations.looper.security import TrustKeyRing, verify_node_request


FIXTURE_PATH = Path(__file__).parents[3] / "fixtures" / "looper" / "strict_protocol_v1.json"


@pytest.fixture(scope="module")
def vectors():
    return json.loads(FIXTURE_PATH.read_text())


def b64(value: str) -> bytes:
    return base64.b64decode(value)


def trust_mapping(vectors, *, revision=7):
    challenge = vectors["challenge"]
    return {
        "version": 1,
        "keys": [
            {
                "key_revision": revision,
                "algorithm": "Ed25519",
                "public_key_b64": vectors["trust"]["public_key_b64"],
                "not_before_ms": challenge["issued_at_ms"] - 1_000,
                "not_after_ms": challenge["expires_at_ms"] + 1_000,
                "state": "active",
            }
        ],
    }


@pytest.mark.unit
def test_trust_ring_verifies_exact_challenge_identity(vectors):
    item = vectors["challenge"]
    ring = TrustKeyRing.from_mapping(trust_mapping(vectors))

    challenge = ring.verify_link_challenge(
        b64(item["envelope_cbor_b64"]),
        now_ms=item["issued_at_ms"] + 1,
        expected_audience=item["audience"],
        expected_network_id=item["network_id"],
        expected_node_id=item["node_id"],
        expected_public_key_sha256=b64(item["public_key_sha256_b64"]),
    )

    assert UUID(bytes=challenge[6]) == UUID(item["challenge_id"])
    assert challenge[7] == b64(item["nonce_b64"])


@pytest.mark.unit
@pytest.mark.parametrize("mismatch", ["revision", "audience", "node", "public_key", "expired"])
def test_trust_ring_fails_closed_on_mismatch_or_expiry(vectors, mismatch):
    item = vectors["challenge"]
    ring = TrustKeyRing.from_mapping(trust_mapping(vectors, revision=8 if mismatch == "revision" else 7))
    kwargs = {
        "now_ms": item["expires_at_ms"] + 1 if mismatch == "expired" else item["issued_at_ms"] + 1,
        "expected_audience": "plane:wrong" if mismatch == "audience" else item["audience"],
        "expected_network_id": item["network_id"],
        "expected_node_id": "node_wrong" if mismatch == "node" else item["node_id"],
        "expected_public_key_sha256": b"\x00" * 32 if mismatch == "public_key" else b64(item["public_key_sha256_b64"]),
    }

    with pytest.raises(ProtocolError):
        ring.verify_link_challenge(b64(item["envelope_cbor_b64"]), **kwargs)


@pytest.mark.unit
@pytest.mark.parametrize("index", [0, 1])
def test_node_request_verifier_reconstructs_signed_http_request(vectors, index):
    item = vectors["node_requests"][index]
    public_key = Ed25519PublicKey.from_public_bytes(b64(vectors["node"]["public_key_b64"]))

    verified = verify_node_request(
        public_key,
        item["signature_header"],
        method=item["method"],
        path=item["raw_path"],
        query=item["raw_query"],
        raw_body=b64(item["raw_body_b64"]),
        now_ms=item["timestamp_ms"],
        dispatch_id=item["dispatch_id"],
        dispatch_revision=item["dispatch_revision"],
        state_version=item["state_version"],
        execution_attempt_id=item["execution_attempt_id"],
        fencing_token=item["fencing_token"],
    )

    assert verified.binding_id == UUID(item["binding_id"])
    assert verified.key_revision == item["key_revision"]
    assert verified.nonce == b64(item["nonce_b64"])
    assert hashlib.sha256(b64(item["raw_body_b64"])).digest() == b64(item["body_sha256_b64"])


@pytest.mark.unit
def test_node_request_verifier_rejects_body_path_and_clock_drift(vectors):
    item = vectors["node_requests"][1]
    public_key = Ed25519PublicKey.from_public_bytes(b64(vectors["node"]["public_key_b64"]))
    common = {
        "public_key": public_key,
        "signature_header": item["signature_header"],
        "method": item["method"],
        "path": item["raw_path"],
        "query": item["raw_query"],
        "raw_body": b64(item["raw_body_b64"]),
        "now_ms": item["timestamp_ms"],
        "dispatch_id": item["dispatch_id"],
        "dispatch_revision": item["dispatch_revision"],
        "state_version": item["state_version"],
        "execution_attempt_id": item["execution_attempt_id"],
        "fencing_token": item["fencing_token"],
    }

    with pytest.raises(ProtocolError, match="signature"):
        verify_node_request(**{**common, "raw_body": common["raw_body"] + b" "})
    with pytest.raises(ProtocolError, match="signature"):
        verify_node_request(**{**common, "path": common["path"] + "/other"})
    with pytest.raises(ProtocolError, match="clock skew"):
        verify_node_request(**{**common, "now_ms": item["timestamp_ms"] + 120_001})


@pytest.mark.unit
def test_trust_key_config_rejects_duplicates_unknown_fields_and_empty_ring(vectors):
    mapping = trust_mapping(vectors)
    with pytest.raises(ProtocolError, match="duplicate"):
        TrustKeyRing.from_mapping({**mapping, "keys": mapping["keys"] * 2})
    with pytest.raises(ProtocolError, match="entry"):
        TrustKeyRing.from_mapping({**mapping, "keys": [{**mapping["keys"][0], "private_key": "forbidden"}]})
    with pytest.raises(ProtocolError, match="empty"):
        TrustKeyRing.from_mapping({"version": 1, "keys": []})
