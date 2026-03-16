# Plane License System: Security Audit & Improvement Roadmap

## 1. How Plane's License System Works Today

### Architecture

```
BUILD TIME:
  PRIVATE_KEY (env var) → goreleaser ldflags → compiled into monitor binary

ONLINE MODE:
  Monitor → POST /api/v2/flags/ (license_key) → Prime Server
  Prime Server → returns EncryptedData { aes_key, nonce, ciphertext, tag }
  Monitor → RSA-OAEP decrypt aes_key with PRIVATE_KEY
          → AES-GCM decrypt payload with aes_key
          → stores encrypted data in local DB
          → decrypts on each feature flag request

AIRGAPPED MODE:
  Customer uploads {workspace_id}_{version}.json file
  Monitor → reads EncryptedData from file
          → same RSA + AES-GCM decryption
          → stores license (seats, expiry, features) in DB
          → serves feature flags from decrypted data
```

### Cryptographic Primitives Used

| Component | Algorithm |
|-----------|-----------|
| Asymmetric decryption | RSA-OAEP with SHA-256 |
| Symmetric decryption | AES-256-GCM (16-byte nonce) |
| Key format | PKCS#1 / PKCS#8, base64-encoded |
| Signature verification | **None** |

### What's in the Encrypted Payload (Airgapped)

- `license_key`, `product_type` (FREE/PRO/ENTERPRISE)
- `purchased_seats`, `free_seats`, `user_count`
- `current_period_end_date` (expiry)
- `workspace_id`, `instance_id`
- `license_users` (member list with roles)
- `flags` (encrypted feature flags — nested encryption)

---

## 2. Industry Comparison

### Cryptographic Architecture

| | **Plane** | **GitHub (GHES)** | **GitLab** | **HashiCorp** | **Keygen.sh** |
|---|---|---|---|---|---|
| Primary mechanism | Encryption only | **Signing only** | **Sign + encrypt** | **Signing only** | **Sign + optional encrypt** |
| Algorithm | RSA-OAEP + AES-GCM | GPG (RSA signatures) | RSA-2048 | Proprietary signed blob | Ed25519 + AES-256-GCM |
| Key embedded in binary | **Private key** | Public key | Public key | Public key | Public key |
| Server holds | Public key | Private (signing) key | Private key | Private (signing) key | Private (signing) key |

**Plane is the only system that embeds the private key in the distributed binary.** Every other vendor embeds the public key.

### Security Properties

| Property | **Plane** | **GHES** | **GitLab** | **HashiCorp** | **Keygen** |
|---|---|---|---|---|---|
| Tamper-proof license | Via GCM tag (tied to private key) | GPG signature | RSA signature | Signed blob | Ed25519 signature |
| Forgery if key extracted from binary | **Yes — full forgery possible** | No — public key can only verify | No — public key can only verify | No | No |
| Confidentiality of license data | Yes (encrypted) | No (plaintext in tar) | Yes (encrypted) | No (inspectable) | Optional |
| Key rotation without rebuild | **No** — key is compiled in | No (but public key is safe) | No (but public key is safe) | No (but public key is safe) | No (but public key is safe) |

### License Binding & Enforcement

| | **Plane** | **GHES** | **GitLab** | **HashiCorp** | **Keygen** |
|---|---|---|---|---|---|
| Machine binding | None | None | None | Soft (Installation ID) | SHA256-HMAC fingerprint |
| Seat enforcement | Local DB count vs `purchased_seats` | Local user count | Local billable user count | Module-based | Configurable |
| Expiry enforcement | Check `current_period_end_date` | Check `expire_at` | Check `expires_at` | Expiration + Termination dates | TTL in signed payload |
| Clock tamper protection | `last_verified_at` field exists | System clock only | System clock only | System clock only | TTL + optional heartbeat |
| License file portability | Any instance | Any instance | Any instance | Any instance | Machine-bound (optional) |

---

## 3. Identified Weaknesses

### Critical

| # | Issue | Impact |
|---|-------|--------|
| 1 | **Private key embedded in binary** | Anyone with the binary can extract the key using `strings`, `go tool objdump`, or a disassembler. With the private key, an attacker can decrypt any license file AND craft forged licenses with arbitrary seats, features, and expiry dates. |
| 2 | **No signature verification** | The system only decrypts — it never verifies that the payload was produced by the prime server. AES-GCM's auth tag proves the ciphertext wasn't tampered with, but it doesn't prove *who created it*. Anyone with the private key can produce valid ciphertext. |
| 3 | **Single global key** | The same private key is compiled into every monitor binary for every customer. One compromised binary = all customers' licenses can be forged. |

### Medium

| # | Issue | Impact |
|---|-------|--------|
| 4 | **No machine binding** | A license file can be copied to unlimited installations. Enforcement is purely contractual. |
| 5 | **Private key as plaintext string through call stack** | The key is passed as a `string` through `main.go → cmd → router → handlers → feat_flag`. Any accidental logging, error dump, or stack trace could expose it. |
| 6 | **Docker build arg leakage** | `ARG PRIVATE_KEY` in the Dockerfile means the key appears in Docker build history and potentially CI logs. |
| 7 | **No key rotation path** | Rotating the key requires rebuilding and redeploying every monitor instance, and re-encrypting every license file. |

### Low

| # | Issue | Impact |
|---|-------|--------|
| 8 | **Clock manipulation** | Customer can set system clock back to extend an expired license. The `last_verified_at` field exists but isn't used as a monotonic guard in airgapped mode. |
| 9 | **License file portability** | No workspace/instance binding in the crypto layer — validation is only at the application logic level (DB checks). |

---

## 4. What Needs to Change

### Phase 1: Fix the Cryptographic Model (Critical)

**Goal**: Make license forgery impossible even if the binary is fully reverse-engineered.

**Change**: Switch from **encrypt-with-public/decrypt-with-private** to **sign-with-private/verify-with-public**.

```
CURRENT (broken):
  Prime (public key) → encrypts → Monitor (PRIVATE key) → decrypts
  Extracted private key = can forge anything

PROPOSED (correct):
  Prime (PRIVATE key) → signs → Monitor (public key) → verifies
  Extracted public key = can only verify, cannot forge
```

**Concrete steps**:

1. **Generate an Ed25519 key pair** on the prime server
   - Private key: stays on prime server only, never leaves
   - Public key: 32 bytes, embedded in monitor binary via ldflags (safe to extract)

2. **Prime server signs license payloads**:
   ```
   payload = JSON({ features, seats, expiry, workspace_id, instance_id, issued_at })
   signature = Ed25519.sign(server_private_key, payload)
   license_file = { payload: base64(payload), signature: base64(signature) }
   ```

3. **Monitor verifies, not decrypts**:
   ```go
   // In monitor binary
   var SERVER_PUBLIC_KEY = `` // embedded via ldflags — SAFE

   func VerifyLicense(payload, signature []byte) error {
       if !ed25519.Verify(publicKey, payload, signature) {
           return errors.New("invalid license signature")
       }
       // Parse payload, check expiry, enforce seats
   }
   ```

4. **Remove the private key from the build pipeline entirely** — no more `ARG PRIVATE_KEY` in Dockerfile, no more private key in goreleaser ldflags.

**Why Ed25519 over RSA**:
- 32-byte public key (vs 256+ bytes for RSA-2048)
- Faster verification
- No padding oracle attacks
- Used by modern systems (Keygen, WireGuard, SSH defaults)

### Phase 2: Add Machine Binding (Medium Priority)

**Goal**: Prevent a single license file from being reused across installations.

**Steps**:

1. **Monitor generates a fingerprint on first boot**:
   ```
   fingerprint = SHA256(machine-id + workspace-id)
   ```
   Stored locally, displayed in admin UI for the customer.

2. **Activation flow** (airgapped):
   ```
   Customer → provides fingerprint to Plane (portal/support)
   Prime → signs: { payload + fingerprint }
   Customer → imports signed license file
   Monitor → verifies signature, checks fingerprint matches local machine
   ```

3. **Online mode**: Fingerprint is sent during the `/api/v2/flags/` call. Prime includes it in the signed response.

### Phase 3: Add Optional Encryption Layer (Low Priority)

Only needed if you want to hide feature flag names from customers (e.g., unreleased features).

```
Prime:
  1. Sign payload with Ed25519 private key
  2. Encrypt with AES-256-GCM, key = SHA256(license_key + fingerprint)

Monitor:
  1. Reconstruct AES key from local license_key + fingerprint
  2. Decrypt
  3. Verify Ed25519 signature
  4. Use payload
```

The decryption key is derived from values the customer already has — no private key needed in the binary.

### Phase 4: Harden Expiry Enforcement (Low Priority)

1. **Monotonic clock guard**: Reject if system time is earlier than `last_verified_at - 24h` (allowing for small clock drift)
2. **Short-lived license files**: Issue licenses with 90-day TTL, require periodic re-activation even for airgapped customers — forces a renewal touchpoint
3. **Two-phase expiry** (HashiCorp model): *Expiration* = features degrade gracefully, *Termination* = hard stop after a grace period

---

## 5. Migration Path

Since existing customers have license files encrypted with the current scheme, migration needs to be backwards-compatible:

| Phase | Action | Downtime |
|-------|--------|----------|
| 1 | Deploy monitor that accepts BOTH formats (encrypted-old OR signed-new) | None |
| 2 | Prime server starts issuing signed licenses. New activations get signed format | None |
| 3 | Existing airgapped customers re-activate with new signed license files | Customer action required |
| 4 | Remove old decryption code path. Remove private key from build pipeline | None |
| 5 | Add machine binding (new activations only) | None |
| 6 | Add optional encryption layer | None |

**Timeline consideration**: Phases 1-2 can ship together. Phase 3 requires customer communication. Phase 4 is a cleanup after all customers have migrated.

---

## 6. Summary

| Area | Current State | Industry Standard | Gap |
|------|--------------|-------------------|-----|
| Key in binary | Private (critical secret) | Public (safe to distribute) | **Critical** |
| Forgery resistance | None if key extracted | Impossible without server key | **Critical** |
| Crypto model | Encryption only | Signing (+ optional encryption) | **Critical** |
| Machine binding | None | Optional but available | Medium |
| Key rotation | Requires full rebuild | Still requires rebuild, but safe | Low |
| Clock protection | Field exists, not enforced | Monotonic guard / TTL | Low |

**The single most impactful change is Phase 1**: switching from an embedded private key to an embedded public key, and from encryption to digital signatures. This aligns Plane with how every major vendor (GitHub, GitLab, HashiCorp) handles offline licensing and eliminates the possibility of license forgery from binary reverse-engineering.

---

## References

- [GitHub Enterprise Server License Files](https://docs.github.com/en/billing/concepts/enterprise-billing/ghes-license-files)
- [GitLab Self-Managed License Activation](https://docs.gitlab.com/administration/license/)
- [GitLab License Gem (gitlab-license)](https://rubygems.org/gems/gitlab-license)
- [HashiCorp Vault Enterprise Licensing](https://developer.hashicorp.com/vault/docs/license)
- [Keygen.sh Offline Licensing Documentation](https://keygen.sh/docs/choosing-a-licensing-model/offline-licenses/)
- [Keygen.sh Cryptography Reference](https://keygen.sh/docs/api/cryptography/)
