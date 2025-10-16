import base64
import hashlib
from django.conf import settings
from cryptography.fernet import Fernet

from plane.utils.exception_logger import log_exception


def derive_key(secret_key):
    # Use a key derivation function to get a suitable encryption key
    dk = hashlib.pbkdf2_hmac("sha256", secret_key.encode(), b"salt", 100000)
    return base64.urlsafe_b64encode(dk)


# Encrypt data
def encrypt_data(data):
    try:
        if data:
            cipher_suite = Fernet(derive_key(settings.SECRET_KEY))
            encrypted_data = cipher_suite.encrypt(data.encode())
            return encrypted_data.decode()  # Convert bytes to string
        else:
            return ""
    except Exception as e:
        log_exception(e)
        return ""


# Decrypt data
def decrypt_data(encrypted_data):
    try:
        if encrypted_data:
            cipher_suite = Fernet(derive_key(settings.SECRET_KEY))
            decrypted_data = cipher_suite.decrypt(encrypted_data.encode())  # Convert string back to bytes
            return decrypted_data.decode()
        else:
            return ""
    except Exception as e:
        log_exception(e)
        return ""
