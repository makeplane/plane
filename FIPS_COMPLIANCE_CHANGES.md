# FIPS Compliance Changes Required

This document lists all locations that need to be modified to achieve FIPS compliance.

## Critical Changes (Must Fix)

### 1. Remove `pycryptodome` Dependency

**Status:** ✅ **COMPLETED** - Replaced with FIPS-compliant `cryptography` library

#### Files Updated:

1. **`apps/api/requirements/base.txt`** ✅ **COMPLETED**
   - ✅ Removed: `pycryptodome==3.22.0`
   - ✅ Now using: `cryptography==44.0.1` (FIPS-compliant when built with FIPS-enabled OpenSSL)

2. **`apps/pi/requirements.txt`** ✅ **COMPLETED**
   - ✅ Removed: `pycryptodome==3.23.0`
   - ✅ Now using: `cryptography==46.0.2` (FIPS-compliant when built with FIPS-enabled OpenSSL)

#### Code Files Updated:

3. **`apps/api/plane/utils/encryption.py`** ✅ **COMPLETED**
   ```python
   # IMPLEMENTED (FIPS-COMPLIANT):
   from cryptography.hazmat.primitives.ciphers.aead import AESGCM
   import secrets  # For FIPS-compliant random bytes generation
   ```
   - ✅ Functions updated:
     - `encrypt()` - Now uses `AESGCM(key).encrypt()` and `secrets.token_bytes()`
     - `decrypt()` - Now uses `AESGCM(key).decrypt()`

4. **`apps/pi/pi/app/utils/encryption.py`** ✅ **COMPLETED**
   ```python
   # IMPLEMENTED (FIPS-COMPLIANT):
   from cryptography.hazmat.primitives.ciphers.aead import AESGCM
   ```
   - ✅ Functions updated:
     - `decrypt()` - Now uses `AESGCM(key).decrypt()`
     - `decrypt_from_string()` - Uses updated `decrypt()` function

### 2. Configure `cryptography` Library for FIPS

**Status:** ⚠️ **CONDITIONAL** - Can be FIPS-compliant if properly configured

#### Files Using `cryptography`:

5. **`apps/api/plane/license/utils/encryption.py`** (Line 15)
   - Uses: `from cryptography.fernet import Fernet`
   - **Action Required:** Ensure OpenSSL is FIPS-enabled and verify FIPS mode enforcement
   - Functions: `encrypt_data()`, `decrypt_data()`

6. **`apps/api/plane/utils/integrations/github.py`** (Lines 17-18)
   - Uses: `from cryptography.hazmat.primitives.serialization import load_pem_private_key`
   - Uses: `from cryptography.hazmat.backends import default_backend`
   - **Action Required:** Verify FIPS mode is enforced

7. **`apps/pi/pi/services/actions/oauth_url_encoder.py`** (Line 21)
   - Uses: `from cryptography.fernet import Fernet`
   - **Action Required:** Ensure FIPS mode enforcement

#### Dependency Files:

8. **`apps/api/requirements/base.txt`** (Line 53)
   - Current: `cryptography==44.0.1`
   - **Action Required:** 
     - Ensure version is compatible with FIPS-enabled OpenSSL
     - Verify build against FIPS-validated OpenSSL in Dockerfile

9. **`apps/pi/requirements.txt`** (Line 12)
   - Current: `cryptography==46.0.2`
   - **Action Required:** Same as above

### 3. Dockerfile Configuration for FIPS

#### Python Applications:

10. **`apps/api/Dockerfile.fips`**
    - **Current:** Uses `registry.access.redhat.com/ubi10/python-312-minimal` ✅ (Good - UBI has FIPS support)
    - **Action Required:**
      - Ensure OpenSSL is FIPS-enabled in the container
      - Add environment variable to enable FIPS mode: `OPENSSL_CONF=/path/to/openssl-fips.cnf`
      - Verify `cryptography` library is built against FIPS-enabled OpenSSL
      - Consider adding: `RUN pip install --no-binary cryptography cryptography` to ensure proper linking

11. **`apps/pi/Dockerfile.fips`**
    - **Current:** Multi-stage build with `python:3.12-slim` builder and `registry.access.redhat.com/ubi10/python-312-minimal` runtime
    - **Action Required:**
      - Ensure builder stage also has FIPS-enabled OpenSSL if building cryptography
      - Verify runtime stage has FIPS mode enabled
      - Add FIPS configuration

#### Node.js Applications:

12. **`apps/silo/Dockerfile.fips`**
    - **Current:** Uses `registry.access.redhat.com/ubi10/nodejs-22` ✅ (Good)
    - **Action Required:**
      - Verify Node.js is built with FIPS support
      - Ensure OpenSSL FIPS mode is enabled
      - The code uses Node.js built-in `crypto` module which should be FIPS-compliant when Node.js is FIPS-enabled

13. **`apps/web/Dockerfile.fips`**
    - **Current:** Uses `registry.access.redhat.com/ubi10/nginx-126` ✅ (Good)
    - **Status:** Already fixed (USER root added)

14. **`apps/admin/Dockerfile.fips`**
    - **Current:** Uses `registry.access.redhat.com/ubi10/nginx-126` ✅ (Good)
    - **Status:** Already fixed (USER root added)

15. **`apps/space/Dockerfile.fips`**
    - **Action Required:** Verify FIPS configuration

16. **`apps/live/Dockerfile.fips`**
    - **Action Required:** Verify FIPS configuration

#### Go Applications:

17. **`apps/monitor/Dockerfile.fips`**
    - **Current:** Uses `registry.access.redhat.com/ubi10/ubi-minimal` ✅ (Good)
    - **Status:** Go standard library crypto should be FIPS-compliant when using FIPS-validated system libraries

18. **`apps/email/Dockerfile.fips`**
    - **Current:** Uses `registry.access.redhat.com/ubi10/ubi-minimal` ✅ (Good)
    - **Status:** Go standard library crypto should be FIPS-compliant

### 4. Node.js Package Overrides

19. **`package.json`** (Line 80)
    - Current: `"pbkdf2": "3.1.3"` in pnpm overrides
    - **Action Required:** 
      - Verify if this package is actually used
      - If used, replace with Node.js built-in `crypto.pbkdf2Sync()` (which is FIPS-compliant)
      - The codebase already uses `crypto.pbkdf2Sync()` in `apps/silo/src/helpers/decrypt.ts`, so this override may be unnecessary

## Implementation Status

### Phase 1: Critical (Blocking FIPS Compliance) - ✅ COMPLETED
1. ✅ **COMPLETED** - Removed `pycryptodome` from requirements files
   - `apps/api/requirements/base.txt` - Removed `pycryptodome==3.22.0`
   - `apps/pi/requirements.txt` - Removed `pycryptodome==3.23.0`

2. ✅ **COMPLETED** - Replaced `Crypto.Cipher.AES` usage with `cryptography.hazmat.primitives.ciphers.aead.AESGCM`
   - `apps/api/plane/utils/encryption.py` - Updated imports and functions
   - `apps/pi/pi/app/utils/encryption.py` - Updated imports and functions

3. ✅ **COMPLETED** - Replaced `Crypto.Random.get_random_bytes()` with `secrets.token_bytes()`
   - `apps/api/plane/utils/encryption.py` - Uses `secrets.token_bytes(12)` for nonce generation

4. ✅ **COMPLETED** - Updated encryption/decryption functions:
   - `apps/api/plane/utils/encryption.py` - Both `encrypt()` and `decrypt()` functions updated
   - `apps/pi/pi/app/utils/encryption.py` - `decrypt()` and `decrypt_from_string()` functions updated

### Phase 2: Configuration (Ensure FIPS Mode) - ⚠️ PENDING
5. ⚠️ **PENDING** - Configure Dockerfiles to enable FIPS mode
   - `apps/api/Dockerfile.fips` - Needs FIPS mode configuration
   - `apps/pi/Dockerfile.fips` - Needs FIPS mode configuration

6. ⚠️ **PENDING** - Verify `cryptography` library is built against FIPS-enabled OpenSSL
   - Ensure Dockerfiles build cryptography with FIPS-enabled OpenSSL

7. ⚠️ **PENDING** - Add FIPS mode verification in application startup
   - Add runtime checks to verify FIPS mode is enabled

8. ⚠️ **PENDING** - Test encryption/decryption with FIPS mode enabled
   - Verify functionality in FIPS-enabled environment

### Phase 3: Verification (Testing & Validation) - ⚠️ PENDING
9. ⚠️ **PENDING** - Add FIPS compliance tests
10. ⚠️ **PENDING** - Verify all cryptographic operations use FIPS-validated algorithms
11. ⚠️ **PENDING** - Document FIPS configuration requirements

## Code Migration Example

### Before (Non-FIPS Compliant):
```python
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

def encrypt(plain_text: str):
    key = derive_key()
    iv = get_random_bytes(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(plain_text.encode())
    return {
        "iv": base64.b64encode(iv).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "tag": base64.b64encode(tag).decode(),
    }
```

### After (FIPS Compliant) - ✅ IMPLEMENTED:
```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import secrets
import base64

def encrypt(plain_text: str):
    key = derive_key()
    aesgcm = AESGCM(key)
    nonce = secrets.token_bytes(12)  # 12 bytes for GCM (FIPS-compliant random generation)
    # AESGCM.encrypt returns ciphertext + tag (16 bytes) concatenated
    encrypted = aesgcm.encrypt(nonce, plain_text.encode(), None)
    # Split ciphertext and tag (last 16 bytes are the tag)
    ciphertext = encrypted[:-16]
    tag = encrypted[-16:]
    return {
        "iv": base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "tag": base64.b64encode(tag).decode(),
    }

def decrypt(encrypted_data: dict):
    key = derive_key()
    aesgcm = AESGCM(key)
    nonce = base64.b64decode(encrypted_data["iv"])
    ciphertext = base64.b64decode(encrypted_data["ciphertext"])
    tag = base64.b64decode(encrypted_data["tag"])
    # Reconstruct: ciphertext + tag for AESGCM.decrypt()
    encrypted = ciphertext + tag
    return aesgcm.decrypt(nonce, encrypted, None).decode()
```

## Testing Requirements

### Completed Verification:
1. ✅ **VERIFIED** - Encryption/decryption works correctly with new implementation
   - Code tested and confirmed working with `cryptography` library
   - Maintains same data format (iv, ciphertext, tag) for backward compatibility

### Pending Verification:
2. ⚠️ **PENDING** - Backward compatibility with existing encrypted data
   - Need to verify that data encrypted with old `pycryptodome` can be decrypted with new implementation
   - Note: This may require migration if data format differs

3. ⚠️ **PENDING** - FIPS mode is actually enabled and enforced
   - Verify in FIPS-enabled environment

4. ⚠️ **PENDING** - No fallback to non-FIPS algorithms
   - Verify cryptography library uses FIPS-validated algorithms only

5. ⚠️ **PENDING** - All tests pass with FIPS mode enabled
   - Run full test suite in FIPS-enabled environment

## Summary

### ✅ Completed Changes:
- Removed all `pycryptodome` dependencies
- Replaced with FIPS-compliant `cryptography` library using `AESGCM`
- Updated all encryption/decryption functions in:
  - `apps/api/plane/utils/encryption.py`
  - `apps/pi/pi/app/utils/encryption.py`
- Code tested and verified working

### ⚠️ Remaining Tasks:
- Configure Dockerfiles for FIPS mode
- Verify FIPS mode enforcement at runtime
- Test backward compatibility with existing encrypted data
- Add FIPS compliance tests

## Notes

- **Node.js `crypto` module:** Already FIPS-compliant when Node.js is built with FIPS support. No changes needed for TypeScript/JavaScript code using built-in `crypto`.
- **Python `hashlib`:** Uses OpenSSL when available, so FIPS-compliant if OpenSSL is FIPS-enabled. No changes needed.
- **Go standard library:** FIPS-compliant when using FIPS-validated system libraries. No changes needed.
- **`cryptography` library:** The code now uses `cryptography.hazmat.primitives.ciphers.aead.AESGCM` which is FIPS-compliant when the library is built against FIPS-enabled OpenSSL (as provided in Red Hat UBI images).
