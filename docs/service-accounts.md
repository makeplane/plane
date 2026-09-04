# Service Accounts

A **service account** is a machine identity for provisioning and automating a
workspace entirely over the API. Unlike a human member, a service account:

- is created directly — **no invite, no email-verification, no password round-trip**;
- **cannot log in interactively** (email/password, magic code, or OAuth are all
  rejected — it is a bot, see `BOT_USER_LOGIN_FORBIDDEN`);
- acts **only through its API token**; and
- is a **valid, distinct actor**: it authenticates as itself and everything it
  creates is attributed to it (`created_by`).

This makes a workspace fully provisionable by scripts and agents without a human
in the loop.

## What gets created

Creating a service account performs three writes in a single transaction:

1. A `User` that is **active** (`is_active=True`) and **email-verified**
   (`is_email_verified=True`, `is_email_valid=True`), flagged as a bot
   (`is_bot=True`, `bot_type=SERVICE`) with an unusable password
   (`is_password_autoset=True`). Its `username` and `display_name` may be
   caller-chosen (see [Identity fields](#identity-fields)) or default to
   synthetic values; its `email` defaults to a unique synthetic address (the
   management command's `--email` can override it) — no mail is ever sent to it.
2. A `WorkspaceMember` binding the user to the workspace at the requested role.
3. An `APIToken` (`user_type=Bot`, `is_service=True`, scoped to the workspace).
   Its plaintext value is printed/returned **once** — store it securely, it
   cannot be retrieved again.

Because `is_bot=True`, the account is omitted from the **web app's** member list
(the internal app API filters bots out of its member endpoints, the same
behaviour as the built-in workspace-seed bot). It is still a full member for
authorization and attribution: it passes permission checks and appears as the
`created_by`/`updated_by` actor on everything it writes, and the **public API**
lists it (e.g. `GET /api/v1/workspaces/{slug}/members/` returns bot members).

Each row from `GET /api/v1/workspaces/{slug}/members/` carries `username`,
`is_bot`, and `bot_type` alongside the usual profile fields and `role`, so
external automation can **find a service account by the stable username it
chose** and tell a bot member apart from a human (`is_bot: true`,
`bot_type: "SERVICE"`). (The paginated `GET .../members-lite/` picker is a
separate, minimal endpoint; it is unchanged and already exposes `is_bot`.)

## Roles

| Name     | Value | Capability                                  |
| -------- | ----- | ------------------------------------------- |
| `admin`  | 20    | Full workspace admin (default)              |
| `member` | 15    | Create/update most entities                 |
| `guest`  | 5     | Read-oriented, limited                      |

The default is `admin`, since a service account usually needs to provision a
workspace end to end. Narrow it with the `role` argument when a token only needs
member/guest scope.

## Creating one — management command

```bash
python manage.py create_service_account \
  --workspace <workspace-slug> \
  --name "CI Provisioner" \
  --role admin \
  --username ci-provisioner \
  --display-name "CI Provisioner"
```

Arguments:

- `--workspace` (required) — target workspace slug.
- `--name` (required) — name for the account; used as the API token label.
- `--role` — `admin` (default), `member`, or `guest`.
- `--username` — optional globally-unique username (see [Identity fields](#identity-fields));
  a synthetic `svc_<uuid>` value is generated when omitted.
- `--display-name` — optional display name shown in the members UI; falls back to
  `--name` when omitted.
- `--email` — optional; a unique synthetic address is generated when omitted.
- `--description` — optional description stored on the token.

The command prints the account details and the API token (shown once):

```text
Service account created successfully
  user_id     : 1c2f...c7f3
  username    : ci-provisioner
  display_name: CI Provisioner
  email       : svc_9d89245e45164385a00e42ff6056cbce@service.plane.local
  role        : admin
  workspace   : my-workspace
API token (shown once — store it securely):
  plane_api_9d89245e45164385a00e42ff6056cbce
```

Use the token with the public API via the `X-Api-Key` header:

```bash
curl -H "X-Api-Key: plane_api_..." https://<host>/api/v1/users/me/
```

## Creating one — admin HTTP endpoint (optional)

The same flow is exposed over HTTP for callers that already hold a
**workspace-admin** API token:

```http
POST /api/v1/workspaces/{slug}/service-accounts/
X-Api-Key: <workspace-admin token>
Content-Type: application/json

{
  "name": "CI Provisioner",
  "role": "admin",
  "username": "ci-provisioner",
  "display_name": "CI Provisioner",
  "description": "optional"
}
```

`username` and `display_name` are optional (see [Identity fields](#identity-fields)).
Response `201 Created` (the `token` is returned once) echoes the effective values:

```json
{
  "id": "1c2f...c7f3",
  "username": "ci-provisioner",
  "email": "svc_...@service.plane.local",
  "display_name": "CI Provisioner",
  "role": 20,
  "workspace": "8f0e...9ab1",
  "token": "plane_api_..."
}
```

The caller must be an **admin** of `{slug}` (enforced by `WorkspaceOwnerPermission`);
any other caller receives `403 Forbidden`. This endpoint requires an existing
admin token, so the first service account in a fresh instance is typically minted
with the management command above.

## Identity fields

`username` and `display_name` let an external provisioner assign stable, readable
identity instead of the server-generated defaults:

- **`username`** — a globally-unique handle. Use it to provision idempotently:
  re-creating with a username that belongs to a **decommissioned** service account
  **of this workspace** **reactivates** that account in place (see [Re-provisioning a
  decommissioned account](#re-provisioning-a-decommissioned-account)); re-creating
  with a username owned by an **active** account, by any **non-service** user (a human
  or a non-`SERVICE` bot), or by a service account from **another workspace**, is
  rejected with **`409 Conflict`** and a machine-readable body
  `{"error": ..., "code": "USERNAME_ALREADY_EXISTS"}`. The name is **never** silently
  mutated into a unique variant. Like every Plane username it is bounded only by
  length (max 128 characters) — Plane applies no charset validator to usernames
  (regular accounts get a random `uuid` handle), so none is imposed here either.
  Omit it to get a synthetic `svc_<uuid>` handle.
- **`display_name`** — the label the workspace members UI shows. Omit it to fall
  back to `name`.

On the management command, a `--username` owned by an active or non-service user
(and a taken `--email`) fails with a clear `CommandError` instead of a raw
traceback; a `--username` belonging to a decommissioned service account reactivates
it (the command prints `Service account reactivated successfully`).

## Managing tokens

An external reconcile/rotation loop can list, mint, rotate, and revoke a service
account's tokens over the API. All endpoints require the caller to be a workspace
**admin** (`WorkspaceOwnerPermission`) and are scoped to a service account
(`{user_id}` must be a `SERVICE` bot in `{slug}`, else `404`).

**List** — `GET /api/v1/workspaces/{slug}/service-accounts/{user_id}/tokens/`

Cursor-paginated. Returns each token's metadata (`label`, `is_active`,
`created_at`, `expired_at`, `last_used`, …); the **secret value is always
withheld**. Revoked tokens are omitted; a rotated-away token remains listed with
`is_active: false`.

**Mint** — `POST .../tokens/`

```http
POST /api/v1/workspaces/{slug}/service-accounts/{user_id}/tokens/
X-Api-Key: <workspace-admin token>
Content-Type: application/json

{ "label": "ci-runner", "expired_at": "2099-12-31T23:59:59Z" }
```

`label`, `description`, and `expired_at` are optional (a supplied `expired_at`
must be in the future). Response `201` returns the new token value **once**:

```json
{ "id": "…", "label": "ci-runner", "is_active": true, "created_at": "…", "expired_at": "…", "token": "plane_api_…" }
```

**Rotate** — `POST .../tokens/{token_id}/rotate/`

Atomically mints a replacement (returned once) and deactivates the old token, so
authenticating with the old value fails immediately. The old token stays listed as
`is_active: false` for audit. The replacement inherits the source token's `label`
and `description`; only the expiry is caller-settable:

| request body | replacement `expired_at` |
| --- | --- |
| `expired_at` omitted (or empty form value) | **inherits** the source token's expiry |
| `{"expired_at": null}` | never expires (explicit opt-out) |
| `{"expired_at": "<future timestamp>"}` | that timestamp |

Rotation never *widens* a credential's validity window unless you ask: an omitted
expiry copies the source token's **absolute** expiry instant, so the replacement
carries the source's *remaining* lifetime — not a renewed window. Rotating a token
that expires next Tuesday yields a replacement that also expires next Tuesday; pass
`expired_at` explicitly to extend it. A supplied timestamp must be in the future
(a past value is rejected with `400`).

Two preconditions are enforced:

- Only an **active** token can be rotated. A token that has already been rotated
  away returns `409 {"code": "TOKEN_NOT_ACTIVE"}` — one source token cannot mint an
  endless chain of replacements; mint a new token instead. (A revoked or
  decommissioned token is no longer addressable and returns `404`.)
- If the source token's expiry has **already elapsed**, inheriting it would hand
  back a token that can never authenticate, so the request returns
  `400 {"code": "SOURCE_TOKEN_EXPIRY_ELAPSED"}`; re-send it with `expired_at` set
  to a **future** timestamp, or `null` for no expiry.

If a `201` is lost in transit (the secret is unrecoverable), recover with
list → revoke the orphaned token → mint a new one.

**Revoke** — `DELETE .../tokens/{token_id}/`

Revokes a single token (`204`); authenticating with it then fails.

Mint and rotate responses carry the plaintext token, so — like the create
endpoint — their bodies are redacted from the `api_activity_logs` request log.

## Decommissioning

`DELETE /api/v1/workspaces/{slug}/service-accounts/{user_id}/` retires an account:
it deactivates **all** its tokens, removes its `ProjectMember` and
`WorkspaceMember` rows, and deactivates the `User` (`is_active=False`). The user
row is **kept**, so historical attribution (`created_by`/`updated_by` on
everything it created) survives, and `is_active=False` alone revokes API access.

The operation is hard-guarded: it only applies to a service account
(`is_bot=True` **and** `bot_type=SERVICE`). Attempting it on a human or any other
bot returns `400 {"error": ..., "code": "NOT_A_SERVICE_ACCOUNT"}`.

### Re-provisioning a decommissioned account

A decommissioned service account is **not** a dead end: because its `User` row is
kept, its username stays claimed. Re-creating a service account with that **same
username** — via `POST .../service-accounts/` or the management command —
**reactivates the retired identity in place** instead of returning `409`:

- the `User` is re-activated (`is_active=True`);
- its workspace membership is restored at the **requested** role (the soft-deleted
  membership row is revived, never duplicated);
- a **fresh** token is minted and returned once (the old, deactivated tokens stay
  inactive).

The response is a normal `201` and carries the **same `id`** as before, so a
retired seat can be re-provisioned by its stable username without minting a new
identity — historical `created_by`/`updated_by` attribution is preserved. Identity
fields other than the membership role (username/email/display_name) are kept as-is;
reactivation is keyed on the username, so a different `name`/`display_name` in the
re-create request does not rename the existing account, and the management command's
`--email` is ignored on this path (it never changes the revived account's email).

Reactivation is **scoped to the workspace the account belonged to.** A username is
globally unique, so it may name a decommissioned service account from a *different*
workspace; that account is **not** revived here (which would resurrect a
foreign-tenant identity under a shared user id). Only a **decommissioned service
account of this workspace** reactivates — a username owned by an active account, by
a human or non-`SERVICE` bot, or by a service account from another workspace all
return `409 {"code": "USERNAME_ALREADY_EXISTS"}` (with a deliberately generic
message that does not confirm the username exists elsewhere).

## Notes

- Tokens are stored verbatim and matched exactly at authentication time; there is
  no way to recover a lost token — mint a new account/token instead.
- The HTTP endpoint's response body is redacted from the API request log
  (`api_activity_logs`), so the minted token is never persisted there in plaintext.
- Provisioning is attributed to the acting admin: the created `WorkspaceMember`
  and `APIToken` carry that admin as `created_by` (the management command has no
  acting user, so those rows are created with no `created_by`).
- The token authenticates only while the account stays active; deactivating the
  `User` (`is_active=False`) immediately revokes access.
