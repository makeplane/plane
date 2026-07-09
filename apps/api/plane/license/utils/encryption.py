# Python imports
import base64
import hashlib
import hmac
import logging
from django.conf import settings
from cryptography.fernet import Fernet

from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane")


def derive_key(secret_key):
    # Derive a deployment-specific salt via HMAC with a fixed application label.
    # Using HMAC(key=secret_key, msg=b'plane:kdf:v2') separates the salt from
    # the stretched password, preventing trivial precomputation even when an
    # attacker knows the label, and ensures per-deployment uniqueness.
    salt = hmac.new(secret_key.encode(), b"plane:kdf:v2", hashlib.sha256).digest()
    dk = hashlib.pbkdf2_hmac("sha256", secret_key.encode(), salt, 100000)
    return base64.urlsafe_b64encode(dk)


def derive_key_legacy(secret_key):
    # Legacy key derivation using hardcoded salt — kept for backward compatibility
    dk = hashlib.pbkdf2_hmac("sha256", secret_key.encode(), b"salt", 100000)
    return base64.urlsafe_b64encode(dk)


# Encrypt data
def encrypt_data(data):
    try:
        if data:
            cipher_suite = Fernet(derive_key(settings.SECRET_KEY))
            encrypted_data = cipher_suite.encrypt(data.encode())  # Convert string to bytes
            return encrypted_data.decode()
        else:
            return ""
    except Exception as e:
        log_exception(e)
        return ""


# Decrypt data
def decrypt_data(encrypted_data):
    if not encrypted_data:
        return ""
    # Try current key derivation
    try:
        cipher_suite = Fernet(derive_key(settings.SECRET_KEY))
        return cipher_suite.decrypt(encrypted_data.encode()).decode()
    except Exception:
        pass
    # Fallback to legacy key derivation
    try:
        cipher_suite = Fernet(derive_key_legacy(settings.SECRET_KEY))
        plaintext = cipher_suite.decrypt(encrypted_data.encode()).decode()
        logger.warning(
            "Decrypted value using legacy key derivation. "
            "Value should be re-encrypted with current scheme."
        )
        return plaintext
    except Exception as e:
        log_exception(e)
        return ""


def decrypt_data_with_status(encrypted_data):
    """Returns (plaintext, used_legacy) tuple."""
    if not encrypted_data:
        return "", False
    try:
        cipher_suite = Fernet(derive_key(settings.SECRET_KEY))
        return cipher_suite.decrypt(encrypted_data.encode()).decode(), False
    except Exception:
        pass
    try:
        cipher_suite = Fernet(derive_key_legacy(settings.SECRET_KEY))
        plaintext = cipher_suite.decrypt(encrypted_data.encode()).decode()
        logger.warning("Decrypted value using legacy key derivation.")
        return plaintext, True
    except Exception as e:
        log_exception(e)
        return "", False
