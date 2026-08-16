# P10B Invitation Signup 500

## Production symptom

Workspace admin invites a new email. The recipient opens the invitation and registers. The browser POSTs to `/auth/sign-up/` (the intended backend endpoint; frontend remains `/sign-up`) and Django returns a plain **Server Error (500)**.

This environment could not SSH to the production host (`plane.aitech.net.au:22` — no route). Live `docker compose logs` were therefore not captured here. The exception class and stack were reconstructed from the current signup code path and then proven in Docker by inducing the same in-request failures.

Do not treat this as a routing bug. Do not redirect `/auth/sign-up/` to the React app.

## Signup path (current)

`POST /auth/sign-up/` → `SignUpAuthEndpoint` → `EmailProvider` → `Adapter.complete_login_or_signup()`:

1. Create `User` (uuid username, password via zxcvbn).
2. Create `Profile`.
3. `save_user_data()` (activate, last-login metadata).
4. `post_user_auth_workflow()` → `process_workspace_project_invitations()`.
5. `user_login()` / session.
6. Redirect.

`SignUpAuthEndpoint` only catches `AuthenticationException`. Any other exception becomes Django’s generic 500.

Invitation security is unchanged: `WorkspaceJoinEndpoint` still requires an authenticated session, matching email, valid token, and the invite’s workspace slug. Unaccepted invites are **not** auto-joined at signup (that would skip the token check / email-squat guard).

## Root cause

`process_workspace_project_invitations()` mixed **critical DB provisioning** with **non-critical side effects** in the synchronous auth request:

1. `WorkspaceMember.objects.bulk_create(...)`
2. `invalidate_cache_directly(..., multiple=True)` → `cache.keys(...)`
3. `track_event.delay(...)` (Celery/Kombu publish to RabbitMQ)
4. Only then `workspace_member_invites.delete()`

If step 2 or 3 raised (broker `OperationalError`, Redis `keys`/`delete_many` failure, serialization error), the request returned 500 **after** User, Profile, and WorkspaceMember already existed, and **before** the invitation row was deleted.

That matches an invited-user-only failure: ordinary signup never enters the loop. Admin invite-send can still succeed (different request). Worker being down is not required; `.delay()` fails in-process when the broker publish fails.

Induced Docker exceptions (same call sites):

| Side effect         | Exception                           | After fix                         |
| ------------------- | ----------------------------------- | --------------------------------- |
| `track_event.delay` | `kombu.exceptions.OperationalError` | logged, HTTP 302, membership kept |
| `cache.keys`        | `RuntimeError`                      | logged, HTTP 302, invite consumed |

Production logs, when collected on the VPS, should show one of those (or a sibling Redis/Kombu error) under `plane.exception` / the API traceback, originating in `workspace_project_join.py`.

## Previous partial DB state after 500

| Object                      | After failed signup (before fix)            |
| --------------------------- | ------------------------------------------- |
| User                        | Created                                     |
| Profile                     | Created                                     |
| WorkspaceMember             | Created (`ignore_conflicts`)                |
| Invitation                  | Still present (`accepted=True` not deleted) |
| Browser                     | 500, no session redirect                    |
| Retry `POST /auth/sign-up/` | `USER_ALREADY_EXIST`                        |

Recovery used to be: sign **in**, then accept/join. Membership could already exist, so join would reactivate rather than duplicate (`ignore_conflicts` / existing-member update).

## Exact fix

- Commit membership + invitation delete inside `transaction.atomic()`.
- After commit, invalidate cache and enqueue analytics inside `try/except` that calls `log_exception` (not `pass`).
- Pass string UUIDs into `track_event.delay`.
- Set `ProjectMember.project_id` when applying accepted project invites (previously omitted; IntegrityError if that path ran).
- Same analytics isolation on `WorkspaceJoinEndpoint` after membership is saved.
- Do not swallow DB/auth errors. Do not auto-join pending invites.

## Broker / cache finding

RabbitMQ/Celery and Redis cache invalidation are **non-critical after membership is persisted**. Either can 500 the old signup request. Docker isolation tests cover both. Live broker/cache health at the incident was not readable from this network.

## Invitation lifecycle

| State            | Signup behavior                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------- |
| No invite        | User + Profile only; redirect                                                               |
| `accepted=False` | User + Profile; invite unchanged; **no** membership                                         |
| `accepted=True`  | User + Profile + WorkspaceMember(role); invite deleted; redirect away from `/auth/sign-up/` |

Join still: auth required, email bind, token, workspace slug, no duplicate members.

## Idempotency

- `bulk_create(..., ignore_conflicts=True)`
- Second signup → `USER_ALREADY_EXIST`, still one `WorkspaceMember`
- Duplicate join/accept remains 400 “already responded” or existing-member update

## Tests

```bash
docker compose -f docker-compose-test.yml run --rm api-tests \
  pytest plane/tests/contract/app/test_invitation_signup_app.py -vv
# 12 passed in 201.67s
```

Related regression (same Docker stack, `--reuse-db`):

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_self_hosted_unlimited.py \
  plane/tests/contract/app/test_authentication.py \
  plane/tests/smoke/test_auth_smoke.py -q
# 44 passed, 1 failed in 1106s
```

The single failure is `TestSelfHostedPolicyEndpoint.test_policy_reports_unlimited_for_self_hosted`: it requires **no** `Instance` row so `build_revision` is a top-level string. The shared test volume already had an activated `Instance` (`is_setup_done=True`), so `build_revision` lives under `config` instead. That is leftover `--reuse-db` state, not an invitation-signup regression. Authentication contract tests (30) and auth smoke (2) passed. Invitation, join-guard, and side-effect isolation tests in this change passed on a healthy stack.

Do not treat RabbitMQ/worker startup as an application failure: wait for healthy compose, then rerun.

## Security

Preserved: CSRF/session on the form POST, zxcvbn password, invitation token secrecy (not logged), email binding, tenant slug isolation, RBAC roles from the invite, rate limit unchanged. Passwords, cookies, and full tokens are not logged.

## Coordinated production verification (P10A)

Do not replace a single backend container.

1. Merge this PR to `preview`.
2. Run **Branch Build CE** (all six images from one SHA + manifest).
3. Run **Deploy Production** with that `build_run_id`.
4. Disposable invite: register → no 500 → redirect → correct role → one membership → later login works.
5. `GET /api/instances/`: `self_hosted=true`, `commercial_gating=false`, `feature_tier=unlimited`, `config.build_revision` equals the release SHA.
