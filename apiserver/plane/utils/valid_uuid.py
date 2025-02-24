import uuid

def is_valid_uuid(uuid_str):
    try:
        uuid.UUID(uuid_str, version=4)
        return True
    except ValueError:
        return False
