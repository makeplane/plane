from django.conf import settings
import base64
import hashlib
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from django.core.exceptions import ImproperlyConfigured

# uses AES-256-GCM to encrypt and decrypt data


def derive_key() -> bytes:
    # Raw 32-byte key for AES-256
    if not settings.AES_SECRET_KEY or not settings.AES_SALT:
        raise ImproperlyConfigured("AES_SECRET_KEY or AES_SALT is not set")
    return hashlib.pbkdf2_hmac(
        "sha256",
        settings.AES_SECRET_KEY.encode(),
        settings.AES_SALT.encode(),
        100_000,
        dklen=32,
    )


def encrypt(plain_text: str):
    key = derive_key()
    iv = get_random_bytes(12)  # 12 bytes for GCM
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(plain_text.encode())

    return {
        "iv": base64.b64encode(iv).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "tag": base64.b64encode(tag).decode(),
    }


def decrypt(encrypted_data: dict):
    key = derive_key()
    iv = base64.b64decode(encrypted_data["iv"])
    ciphertext = base64.b64decode(encrypted_data["ciphertext"])
    tag = base64.b64decode(encrypted_data["tag"])
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    return cipher.decrypt_and_verify(ciphertext, tag).decode()
