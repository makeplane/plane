# Python imports
import uuid
import hashlib


def is_valid_uuid(uuid_str):
    """Check if a string is a valid UUID version 4"""
    try:
        uuid_obj = uuid.UUID(uuid_str)
        return uuid_obj.version == 4
    except ValueError:
        return False


def convert_uuid_to_integer(uuid_val: uuid.UUID) -> int:
    """Convert a UUID to a 64-bit signed integer"""
    # Ensure UUID is a string
    uuid_value: str = str(uuid_val)
    # Hash to 64-bit signed int
    h: bytes = hashlib.sha256(uuid_value.encode()).digest()
    bigint: int = int.from_bytes(h[:8], byteorder="big", signed=True)
    return bigint
