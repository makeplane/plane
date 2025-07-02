import secrets
import string


def generate_short_id(length=6):
    """Generate a short random identifier (lowercase + digits only)"""
    min_length = 4
    if length < min_length:
        raise ValueError(f"Length must be at least {min_length}")
    alphabet = string.ascii_lowercase + string.digits  # a-z, 0-9
    return "".join(secrets.choice(alphabet) for _ in range(length))
