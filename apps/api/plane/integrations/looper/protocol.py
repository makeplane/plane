"""Byte-exact strict-dispatch signing protocol shared with Looper.

The signed payload is deterministic CBOR.  JSON, string concatenation, and
library-specific struct encodings are deliberately excluded from the trust
boundary.
"""

import base64
import hashlib
import re
from typing import Any
from urllib.parse import quote_from_bytes
from uuid import UUID

import cbor2
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey


LINK_CHALLENGE_PROFILE = "LOOPER-LINK-CHALLENGE-V1"
LINK_PROOF_PROFILE = "LOOPER-LINK-PROOF-V1"
NODE_REQUEST_PROFILE = "LOOPER-NODE-REQUEST-V1"
ALGORITHM = "Ed25519"

_PROFILES = {LINK_CHALLENGE_PROFILE, LINK_PROOF_PROFILE, NODE_REQUEST_PROFILE}
_UNRESERVED = frozenset(b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")
_HEX = frozenset(b"0123456789abcdefABCDEF")
_CONTROL_RE = re.compile(r"[\x00-\x1f\x7f]")


class ProtocolError(ValueError):
    """The request is not an exact strict-protocol value."""


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise ProtocolError(message)


def _uuid_bytes(value: UUID | str | bytes) -> bytes:
    if isinstance(value, UUID):
        return value.bytes
    if isinstance(value, bytes):
        _require(len(value) == 16, "UUID byte strings must contain 16 bytes")
        return value
    try:
        return UUID(str(value)).bytes
    except (ValueError, TypeError, AttributeError) as exc:
        raise ProtocolError("invalid UUID") from exc


def _fixed_bytes(value: bytes, size: int, name: str) -> bytes:
    _require(isinstance(value, bytes) and len(value) == size, f"{name} must contain {size} bytes")
    return value


def _opaque_id(value: str, name: str) -> str:
    _require(isinstance(value, str), f"{name} must be text")
    encoded = value.encode("utf-8")
    _require(1 <= len(encoded) <= 128, f"{name} must contain 1..128 UTF-8 bytes")
    _require(not _CONTROL_RE.search(value), f"{name} contains control characters")
    return value


def _uint(value: int | None, name: str, *, nullable: bool = False) -> int | None:
    if value is None and nullable:
        return None
    _require(type(value) is int and value >= 0, f"{name} must be an unsigned integer")
    return value


def _int(value: int, name: str) -> int:
    _require(type(value) is int, f"{name} must be an integer")
    return value


def _validate_cbor_value(value: Any) -> None:
    if value is None or isinstance(value, (bytes, str)) or type(value) is int:
        return
    if isinstance(value, list):
        for child in value:
            _validate_cbor_value(child)
        return
    if isinstance(value, dict):
        for key, child in value.items():
            _require(type(key) is int, "CBOR map keys must be integers")
            _validate_cbor_value(child)
        return
    raise ProtocolError(f"unsupported CBOR value type: {type(value).__name__}")


def canonical_cbor(value: Any) -> bytes:
    _validate_cbor_value(value)
    return cbor2.dumps(value, canonical=True)


def decode_canonical_cbor(payload: bytes) -> Any:
    _require(isinstance(payload, bytes), "CBOR payload must be bytes")
    _require(0 < len(payload) <= 64 * 1024, "CBOR payload size is invalid")
    try:
        value = cbor2.loads(payload)
    except (cbor2.CBORDecodeError, ValueError) as exc:
        raise ProtocolError("invalid CBOR payload") from exc
    _validate_cbor_value(value)
    _require(canonical_cbor(value) == payload, "CBOR payload is not deterministic")
    return value


def domain_digest(profile: str, payload: bytes) -> bytes:
    _require(profile in _PROFILES, "unknown signature profile")
    _require(isinstance(payload, bytes), "signed payload must be bytes")
    return hashlib.sha256(profile.encode("utf-8") + b"\x00" + payload).digest()


def encode_link_challenge(
    *,
    network_id: str,
    node_id: str,
    public_key_sha256: bytes,
    audience: str,
    challenge_id: UUID | str | bytes,
    nonce: bytes,
    issued_at_ms: int,
    expires_at_ms: int,
) -> bytes:
    _require(expires_at_ms > issued_at_ms, "challenge expiry must be after issuance")
    return canonical_cbor(
        {
            1: 1,
            2: _opaque_id(network_id, "network_id"),
            3: _opaque_id(node_id, "node_id"),
            4: _fixed_bytes(public_key_sha256, 32, "public_key_sha256"),
            5: _opaque_id(audience, "audience"),
            6: _uuid_bytes(challenge_id),
            7: _fixed_bytes(nonce, 16, "nonce"),
            8: _int(issued_at_ms, "issued_at_ms"),
            9: _int(expires_at_ms, "expires_at_ms"),
        }
    )


def decode_link_challenge(payload: bytes) -> dict[int, Any]:
    value = _decode_map(payload, set(range(1, 10)), "link challenge")
    _require(value[1] == 1, "unsupported link challenge version")
    _opaque_id(value[2], "network_id")
    _opaque_id(value[3], "node_id")
    _fixed_bytes(value[4], 32, "public_key_sha256")
    _opaque_id(value[5], "audience")
    _uuid_bytes(value[6])
    _fixed_bytes(value[7], 16, "nonce")
    _int(value[8], "issued_at_ms")
    _int(value[9], "expires_at_ms")
    _require(value[9] > value[8], "challenge expiry must be after issuance")
    return value


def encode_link_proof(
    *,
    challenge_sha256: bytes,
    plane_workspace_id: UUID | str | bytes,
    plane_project_id: UUID | str | bytes,
    member_id: UUID | str | bytes,
    public_key: bytes,
) -> bytes:
    return canonical_cbor(
        {
            1: 1,
            2: _fixed_bytes(challenge_sha256, 32, "challenge_sha256"),
            3: _uuid_bytes(plane_workspace_id),
            4: _uuid_bytes(plane_project_id),
            5: _uuid_bytes(member_id),
            6: _fixed_bytes(public_key, 32, "public_key"),
            7: ALGORITHM,
        }
    )


def decode_link_proof(payload: bytes) -> dict[int, Any]:
    value = _decode_map(payload, set(range(1, 8)), "link proof")
    _require(value[1] == 1, "unsupported link proof version")
    _fixed_bytes(value[2], 32, "challenge_sha256")
    for key in (3, 4, 5):
        _uuid_bytes(value[key])
    _fixed_bytes(value[6], 32, "public_key")
    _require(value[7] == ALGORITHM, "unsupported link proof algorithm")
    return value


def encode_link_request(*, challenge_envelope: bytes, proof_envelope: bytes) -> bytes:
    challenge = decode_envelope(challenge_envelope)
    proof = decode_envelope(proof_envelope)
    _require(proof[1] == 0, "initial link proof key revision must be zero")
    return canonical_cbor(
        {
            1: {1: challenge[1], 2: challenge[2], 3: challenge[3], 4: challenge[4]},
            2: {1: proof[1], 2: proof[2], 3: proof[3], 4: proof[4]},
        }
    )


def decode_link_request(payload: bytes) -> tuple[bytes, bytes]:
    value = _decode_map(payload, {1, 2}, "link request")
    _require(isinstance(value[1], dict) and isinstance(value[2], dict), "link request envelopes must be maps")
    challenge = canonical_cbor(value[1])
    proof = canonical_cbor(value[2])
    decode_envelope(challenge)
    decoded_proof = decode_envelope(proof)
    _require(decoded_proof[1] == 0, "initial link proof key revision must be zero")
    return challenge, proof


def encode_node_request(
    *,
    method: str,
    path: str,
    query: str,
    body_sha256: bytes,
    binding_id: UUID | str | bytes,
    key_revision: int,
    dispatch_id: UUID | str | bytes | None,
    dispatch_revision: int | None,
    state_version: int | None,
    execution_attempt_id: UUID | str | bytes | None,
    fencing_token: int | None,
    timestamp_ms: int,
    nonce: bytes,
) -> bytes:
    _require(isinstance(method, str) and method == method.upper() and method.isalpha(), "method must be uppercase")
    canonical_path = canonicalize_path(path)
    canonical_query = canonicalize_query(query)
    return canonical_cbor(
        {
            1: 1,
            2: method,
            3: canonical_path,
            4: canonical_query,
            5: _fixed_bytes(body_sha256, 32, "body_sha256"),
            6: _uuid_bytes(binding_id),
            7: _uint(key_revision, "key_revision"),
            8: None if dispatch_id is None else _uuid_bytes(dispatch_id),
            9: _uint(dispatch_revision, "dispatch_revision", nullable=True),
            10: _uint(state_version, "state_version", nullable=True),
            11: None if execution_attempt_id is None else _uuid_bytes(execution_attempt_id),
            12: _uint(fencing_token, "fencing_token", nullable=True),
            13: _int(timestamp_ms, "timestamp_ms"),
            14: _fixed_bytes(nonce, 16, "nonce"),
        }
    )


def decode_node_request(payload: bytes) -> dict[int, Any]:
    value = _decode_map(payload, set(range(1, 15)), "node request")
    _require(value[1] == 1, "unsupported node request version")
    _require(isinstance(value[2], str) and value[2] == value[2].upper() and value[2].isalpha(), "invalid method")
    _require(canonicalize_path(value[3]) == value[3], "node request path is not canonical")
    _require(canonicalize_query(value[4]) == value[4], "node request query is not canonical")
    _fixed_bytes(value[5], 32, "body_sha256")
    _uuid_bytes(value[6])
    _uint(value[7], "key_revision")
    if value[8] is not None:
        _uuid_bytes(value[8])
    _uint(value[9], "dispatch_revision", nullable=True)
    _uint(value[10], "state_version", nullable=True)
    if value[11] is not None:
        _uuid_bytes(value[11])
    _uint(value[12], "fencing_token", nullable=True)
    _int(value[13], "timestamp_ms")
    _fixed_bytes(value[14], 16, "nonce")
    _require((value[8] is None) == (value[9] is None), "dispatch id and revision must both be null or present")
    _require((value[11] is None) == (value[12] is None), "attempt id and fencing token must both be null or present")
    return value


def encode_envelope(*, key_revision: int, payload: bytes, signature: bytes) -> bytes:
    return canonical_cbor(
        {
            1: _uint(key_revision, "key_revision"),
            2: ALGORITHM,
            3: payload,
            4: _fixed_bytes(signature, 64, "signature"),
        }
    )


def decode_envelope(envelope: bytes) -> dict[int, Any]:
    value = _decode_map(envelope, {1, 2, 3, 4}, "signed envelope")
    _uint(value[1], "key_revision")
    _require(value[2] == ALGORITHM, "unsupported signature algorithm")
    _require(isinstance(value[3], bytes) and value[3], "envelope payload must be bytes")
    _fixed_bytes(value[4], 64, "signature")
    return value


def sign_envelope(
    private_key: Ed25519PrivateKey,
    *,
    profile: str,
    key_revision: int,
    payload: bytes,
) -> bytes:
    signature = private_key.sign(domain_digest(profile, payload))
    return encode_envelope(key_revision=key_revision, payload=payload, signature=signature)


def verify_envelope(
    public_key: Ed25519PublicKey,
    *,
    profile: str,
    envelope: bytes,
    expected_key_revision: int | None = None,
) -> bytes:
    decoded = decode_envelope(envelope)
    if expected_key_revision is not None:
        _require(decoded[1] == expected_key_revision, "unexpected key revision")
    try:
        public_key.verify(decoded[4], domain_digest(profile, decoded[3]))
    except InvalidSignature as exc:
        raise ProtocolError("invalid Ed25519 signature") from exc
    return decoded[3]


def canonicalize_path(path: str) -> str:
    _require(isinstance(path, str) and path.startswith("/"), "path must be absolute")
    _require("\\" not in path and not _CONTROL_RE.search(path), "path contains forbidden characters")
    raw_segments = path.split("/")
    normalized: list[bytes] = []
    for raw_segment in raw_segments[1:]:
        decoded = _strict_percent_decode(raw_segment)
        _require(b"/" not in decoded and b"\\" not in decoded, "encoded path separators are forbidden")
        if decoded == b".":
            continue
        if decoded == b"..":
            _require(bool(normalized), "path escapes its root")
            normalized.pop()
            continue
        normalized.append(decoded)
    return "/" + "/".join(_percent_encode(segment) for segment in normalized)


def canonicalize_query(query: str) -> str:
    _require(isinstance(query, str), "query must be text")
    if query == "":
        return ""
    pairs: list[tuple[bytes, bytes]] = []
    for field in query.split("&"):
        _require("=" in field, "query fields must contain '='")
        key, value = field.split("=", 1)
        pairs.append((_strict_percent_decode(key), _strict_percent_decode(value)))
    pairs.sort()
    return "&".join(f"{_percent_encode(key)}={_percent_encode(value)}" for key, value in pairs)


def b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def b64url_decode(value: str, *, expected_size: int | None = None) -> bytes:
    _require(isinstance(value, str) and value and "=" not in value, "base64url must be unpadded")
    try:
        decoded = base64.b64decode(value + "=" * (-len(value) % 4), altchars=b"-_", validate=True)
    except (ValueError, TypeError) as exc:
        raise ProtocolError("invalid base64url") from exc
    if expected_size is not None:
        _fixed_bytes(decoded, expected_size, "base64url value")
    return decoded


def format_signature_header(
    *,
    binding_id: UUID | str | bytes,
    key_revision: int,
    timestamp_ms: int,
    nonce: bytes,
    signature: bytes,
) -> str:
    binding = UUID(bytes=_uuid_bytes(binding_id))
    return (
        f"v=1; key={binding}:{_uint(key_revision, 'key_revision')}; "
        f"ts={_int(timestamp_ms, 'timestamp_ms')}; "
        f"nonce={b64url_encode(_fixed_bytes(nonce, 16, 'nonce'))}; "
        f"sig={b64url_encode(_fixed_bytes(signature, 64, 'signature'))}"
    )


def parse_signature_header(value: str) -> dict[str, Any]:
    _require(isinstance(value, str) and value, "Looper-Signature is required")
    fields: dict[str, str] = {}
    for part in value.split(";"):
        item = part.strip()
        _require(item.count("=") == 1, "invalid Looper-Signature field")
        key, raw = item.split("=", 1)
        _require(key in {"v", "key", "ts", "nonce", "sig"}, "unknown Looper-Signature field")
        _require(key not in fields and raw != "", "duplicate or empty Looper-Signature field")
        fields[key] = raw
    _require(set(fields) == {"v", "key", "ts", "nonce", "sig"}, "incomplete Looper-Signature")
    _require(fields["v"] == "1", "unsupported Looper-Signature version")
    _require(fields["key"].count(":") == 1, "invalid Looper-Signature key")
    binding_text, revision_text = fields["key"].split(":", 1)
    try:
        binding_id = UUID(binding_text)
        key_revision = int(revision_text)
        timestamp_ms = int(fields["ts"])
    except (ValueError, TypeError) as exc:
        raise ProtocolError("invalid Looper-Signature numeric or UUID field") from exc
    _uint(key_revision, "key_revision")
    _int(timestamp_ms, "timestamp_ms")
    return {
        "binding_id": binding_id,
        "key_revision": key_revision,
        "timestamp_ms": timestamp_ms,
        "nonce": b64url_decode(fields["nonce"], expected_size=16),
        "signature": b64url_decode(fields["sig"], expected_size=64),
    }


def _decode_map(payload: bytes, expected_keys: set[int], name: str) -> dict[int, Any]:
    value = decode_canonical_cbor(payload)
    _require(isinstance(value, dict), f"{name} must be a CBOR map")
    _require(set(value) == expected_keys, f"{name} fields are incomplete or unknown")
    return value


def _strict_percent_decode(value: str) -> bytes:
    try:
        raw = value.encode("utf-8")
    except UnicodeEncodeError as exc:
        raise ProtocolError("invalid UTF-8 URL component") from exc
    output = bytearray()
    index = 0
    while index < len(raw):
        if raw[index] != ord("%"):
            output.append(raw[index])
            index += 1
            continue
        _require(index + 2 < len(raw), "truncated percent escape")
        _require(raw[index + 1] in _HEX and raw[index + 2] in _HEX, "invalid percent escape")
        output.append(int(raw[index + 1 : index + 3], 16))
        index += 3
    return bytes(output)


def _percent_encode(value: bytes) -> str:
    # quote_from_bytes is used only after strict decoding; safe is exactly RFC
    # 3986 unreserved, and it emits uppercase percent escapes.
    return quote_from_bytes(value, safe=bytes(_UNRESERVED).decode("ascii"))
