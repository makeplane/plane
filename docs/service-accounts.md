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
   (`is_password_autoset=True`). Its `username`/`email` are unique, synthetic
   identifiers — no mail is ever sent to them.
2. A `WorkspaceMember` binding the user to the workspace at the requested role.
3. An `APIToken` (`user_type=Bot`, `is_service=True`, scoped to the workspace).
   Its plaintext value is printed/returned **once** — store it securely, it
   cannot be retrieved again.

Because `is_bot=True`, the account is intentionally omitted from the human-facing
workspace **member list** (the same behaviour as the built-in workspace-seed bot).
It is still a full member for authorization and attribution: it passes permission
checks and appears as the `created_by`/`updated_by` actor on everything it writes,
and it is visible via the API (e.g. `GET /api/v1/workspaces/{slug}/members/`).

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
  --role admin
```

Arguments:

- `--workspace` (required) — target workspace slug.
- `--name` (required) — display name for the account.
- `--role` — `admin` (default), `member`, or `guest`.
- `--email` — optional; a unique synthetic address is generated when omitted.
- `--description` — optional description stored on the token.

The command prints the account details and the API token (shown once):

```text
Service account created successfully
  user_id  : 1c2f...c7f3
  username : svc_9d89245e45164385a00e42ff6056cbce
  email    : svc_9d89245e45164385a00e42ff6056cbce@service.plane.local
  role     : admin
  workspace: my-workspace
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

{ "name": "CI Provisioner", "role": "admin", "description": "optional" }
```

Response `201 Created` (the `token` is returned once):

```json
{
  "id": "1c2f...c7f3",
  "username": "svc_...",
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
