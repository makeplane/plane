"""Trust-root and signed-request verification for strict Looper traffic."""

import base64
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from uuid import UUID

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from .protocol import (
    LINK_CHALLENGE_PROFILE,
    NODE_REQUEST_PROFILE,
    ProtocolError,
    decode_envelope,
    decode_link_challenge,
    domain_digest,
    encode_node_request,
    parse_signature_header,
    verify_envelope,
)


MAX_CLOCK_SKEW_MS = 120_000
MAX_LINK_CHALLENGE_LIFETIME_MS = 120_000


@dataclass(frozen=True)
class TrustKey:
    key_revision: int
    public_key: Ed25519PublicKey
    not_before_ms: int
    not_after_ms: int
    state: str


class TrustKeyRing:
    """Versioned loopernet trust roots loaded only from server-side secrets."""

    def __init__(self, keys: list[TrustKey]):
        if not keys:
            raise ProtocolError("loopernet trust key ring is empty")
        revisions = [key.key_revision for key in keys]
        if len(revisions) != len(set(revisions)):
            raise ProtocolError("duplicate loopernet trust key revision")
        self._keys = {key.key_revision: key for key in keys}

    @classmethod
    def from_file(cls, path: str | Path) -> "TrustKeyRing":
        try:
            value = json.loads(Path(path).read_text())
        except (OSError, json.JSONDecodeError) as exc:
            raise ProtocolError("cannot load loopernet trust key ring") from exc
        return cls.from_mapping(value)

    @classmethod
    def from_mapping(cls, value: Any) -> "TrustKeyRing":
        if not isinstance(value, dict) or set(value) != {"version", "keys"} or value["version"] != 1:
            raise ProtocolError("invalid loopernet trust key ring schema")
        if not isinstance(value["keys"], list):
            raise ProtocolError("loopernet trust keys must be a list")
        keys = []
        for item in value["keys"]:
            expected = {"key_revision", "algorithm", "public_key_b64", "not_before_ms", "not_after_ms", "state"}
            if not isinstance(item, dict) or set(item) != expected:
                raise ProtocolError("invalid loopernet trust key entry")
            if item["algorithm"] != "Ed25519" or item["state"] not in {"active", "retiring"}:
                raise ProtocolError("unsupported loopernet trust key algorithm or state")
            if type(item["key_revision"]) is not int or item["key_revision"] < 0:
                raise ProtocolError("invalid loopernet trust key revision")
            if type(item["not_before_ms"]) is not int or type(item["not_after_ms"]) is not int:
                raise ProtocolError("invalid loopernet trust key validity window")
            if item["not_after_ms"] <= item["not_before_ms"]:
                raise ProtocolError("loopernet trust key validity window is empty")
            try:
                public_bytes = base64.b64decode(item["public_key_b64"], validate=True)
                public_key = Ed25519PublicKey.from_public_bytes(public_bytes)
            except (ValueError, TypeError) as exc:
                raise ProtocolError("invalid loopernet trust public key") from exc
            keys.append(
                TrustKey(
                    key_revision=item["key_revision"],
                    public_key=public_key,
                    not_before_ms=item["not_before_ms"],
                    not_after_ms=item["not_after_ms"],
                    state=item["state"],
                )
            )
        return cls(keys)

    def verify_link_challenge(
        self,
        envelope: bytes,
        *,
        now_ms: int,
        expected_audience: str,
        expected_network_id: str,
        expected_node_id: str,
        expected_public_key_sha256: bytes,
    ) -> dict[int, Any]:
        decoded_envelope = decode_envelope(envelope)
        trust_key = self._keys.get(decoded_envelope[1])
        if trust_key is None:
            raise ProtocolError("unknown loopernet trust key revision")
        if not trust_key.not_before_ms <= now_ms <= trust_key.not_after_ms:
            raise ProtocolError("loopernet trust key is outside its validity window")
        payload = verify_envelope(
            trust_key.public_key,
            profile=LINK_CHALLENGE_PROFILE,
            envelope=envelope,
            expected_key_revision=trust_key.key_revision,
        )
        challenge = decode_link_challenge(payload)
        if challenge[5] != expected_audience:
            raise ProtocolError("link challenge audience mismatch")
        if challenge[2] != expected_network_id or challenge[3] != expected_node_id:
            raise ProtocolError("link challenge network or node mismatch")
        if challenge[4] != expected_public_key_sha256:
            raise ProtocolError("link challenge public key hash mismatch")
        if challenge[9] - challenge[8] > MAX_LINK_CHALLENGE_LIFETIME_MS:
            raise ProtocolError("link challenge lifetime is too long")
        if not challenge[8] <= now_ms <= challenge[9]:
            raise ProtocolError("link challenge is expired or not yet valid")
        return challenge


@dataclass(frozen=True)
class VerifiedNodeRequest:
    binding_id: UUID
    key_revision: int
    timestamp_ms: int
    nonce: bytes
    payload: bytes


def verify_node_request(
    public_key: Ed25519PublicKey,
    signature_header: str,
    *,
    method: str,
    path: str,
    query: str,
    raw_body: bytes,
    now_ms: int,
    dispatch_id: UUID | str | bytes | None = None,
    dispatch_revision: int | None = None,
    state_version: int | None = None,
    execution_attempt_id: UUID | str | bytes | None = None,
    fencing_token: int | None = None,
) -> VerifiedNodeRequest:
    header = parse_signature_header(signature_header)
    if abs(now_ms - header["timestamp_ms"]) > MAX_CLOCK_SKEW_MS:
        raise ProtocolError("signed request timestamp is outside the allowed clock skew")
    import hashlib

    payload = encode_node_request(
        method=method,
        path=path,
        query=query,
        body_sha256=hashlib.sha256(raw_body).digest(),
        binding_id=header["binding_id"],
        key_revision=header["key_revision"],
        dispatch_id=dispatch_id,
        dispatch_revision=dispatch_revision,
        state_version=state_version,
        execution_attempt_id=execution_attempt_id,
        fencing_token=fencing_token,
        timestamp_ms=header["timestamp_ms"],
        nonce=header["nonce"],
    )
    try:
        public_key.verify(header["signature"], domain_digest(NODE_REQUEST_PROFILE, payload))
    except InvalidSignature as exc:
        raise ProtocolError("invalid Node request signature") from exc
    return VerifiedNodeRequest(
        binding_id=header["binding_id"],
        key_revision=header["key_revision"],
        timestamp_ms=header["timestamp_ms"],
        nonce=header["nonce"],
        payload=payload,
    )
