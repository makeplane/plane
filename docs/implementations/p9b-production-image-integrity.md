# P9B Production Image Integrity & Self-Hosted Feature Regression

## Summary

P9B is operations-only. After the custom Docker Hub rollout, production appeared to lose previously unlocked self-hosted functionality. Source inspection and live checks show the opposite of a missing-product-domain failure:

- `GET https://plane.aitech.net.au/api/instances/` already reports the Community self-hosted unlimited policy.
- The production web bundle already contains Community fingerprints (Worklogs, Import Hub / Jira, Active Cycles) and does not register standalone Wiki.
- The richer commercial settings menu (Projects, Integrations, Connections, Teamspaces, Wiki, Initiatives, Customers, Templates) is **source-absent** in this Community checkout. It is not evidence that preview is broken.

The real integrity defects were in the production Compose path: a commercial v3.0.1 dump with silent `makeplane/*-commercial` fallbacks, committed live secrets, Watchtower on mutable tags, and no build SHA/digest identity. Those are fixed here. No product domains were added. No Enterprise/license/subscription state was faked.

P9A (PR #18, merge `817e5281a3`) is on `preview`. `git remote -v` confirms `origin` is `AFZidan/plane` and `upstream` is `makeplane/plane`.

## Root cause

1. **Wrong production topology.** The VPS-facing file `docker-compose-prod.yml` was a generated commercial v3.0.1 Compose dump (`docker compose config` of the live stack), not the Community installer topology. It started PI, Silo, Monitor, email, iframely, automation-consumer, importer-worker, outbox-poller, and webhook-consumer — services this fork does not implement.
2. **Silent commercial image fallbacks.** Every Plane app used `${PLANE_IMAGE_*:?}`-missing defaults such as `makeplane/admin-commercial:v3.0.1` and `makeplane/backend-commercial:v3.0.1`. An unset or empty GitHub/host variable pulled commercial images instead of failing.
3. **Mutable-tag Watchtower.** App containers were labeled for Watchtower. A partial Hub publish could replace only frontend or only backend and produce a mixed deployment. A matching tag is not a matching digest.
4. **No immutable build identity.** Images were not labeled with `org.opencontainers.image.revision`. Operators could not prove which commit a running container contained.
5. **False feature regression.** Commercial UI surfaces that are not in this Community source were treated as “lost unlocks.” They were never implemented here (see Remaining source-absent features). Workspace Settings Features still registers **Worklogs only**.

Live production at investigation time already ran Community policy and Community frontend routes. `instance.current_version` was still `v3.0.1` because `register_instance` prefers `APP_VERSION`, which the commercial dump set to `v3.0.1`. Community Compose no longer passes that variable.

## Expected source behavior (preview)

Verified in current source before changing deployment files.

| Area                    | Source status               | Location                                                                                    |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| Worklogs                | Exists                      | `/:workspaceSlug/settings/worklogs`; issue widget; `issue_worklogs` CRUD/export             |
| TIME estimates          | Exists (self-hosted unlock) | `isEstimateSystemEnabled(..., isSelfHosted)`                                                |
| Active Cycles           | Exists                      | `/:workspaceSlug/active-cycles`; `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS.active_cycles` |
| Bulk archive            | Exists                      | `useBulkOperationStatus()` → `!hasCommercialGating`; `POST .../bulk-archive-issues/`        |
| Import Hub / Jira Cloud | Partial                     | Five-card hub; only Jira Cloud has a backend; `/settings/imports/jira`                      |
| Analytics               | Exists                      | `/:workspaceSlug/analytics/:tabId`                                                          |
| Exports                 | Exists                      | `/:workspaceSlug/settings/exports`                                                          |
| Webhooks                | Exists                      | `/:workspaceSlug/settings/webhooks`                                                         |
| API tokens              | Exists                      | Profile `/settings/profile/api-tokens`                                                      |
| Public projects         | Exists                      | `capabilities.public_projects`; DeployBoard / Space                                         |
| AI when configured      | Exists                      | `has_llm_configured` / `capabilities.ai.ready`                                              |
| Admin Readiness         | Exists                      | Admin `/readiness` over `GET /api/instances/`                                               |

Workspace Settings Features group (`packages/constants/src/settings/workspace.ts`):

```ts
[WORKSPACE_SETTINGS_CATEGORY.FEATURES]: [WORKSPACE_SETTINGS["worklogs"]],
```

That is intentional. Worklogs is the only Features-group item.

## Production Compose selected

**One supported production topology: root `docker-compose.yml`.**

`docker-compose-prod.yml` is a compatibility alias that `include`s `docker-compose.yml` so existing VPS commands keep working:

```bash
docker compose -f docker-compose-prod.yml ...
```

Both files must be present in the same directory. Do not restore the commercial dump.

`deployments/cli/community/docker-compose.yml` remains the installer/CLI path (`deploy.replicas`). It uses the same image variables, fail-fast interpolation, and no Watchtower. That is the only second Compose file, and it is the install.sh path — not a competing commercial topology.

Community services: `web`, `admin`, `space`, `api`, `worker`, `beat-worker`, `migrator`, `live`, `plane-db`, `plane-redis`, `plane-mq`, `plane-minio`, `proxy`.

API, worker, beat-worker, and migrator all use `PLANE_IMAGE_BACKEND`.

Removed commercial-only services and env: `email`, `iframely`, `monitor`, `silo`, `pi-*`, `automation-consumer`, `importer-worker`, `outbox-poller`, `webhook-consumer`, `PAYMENT_SERVER_BASE_URL`, `FEATURE_FLAG_SERVER_BASE_URL`, `PRIME_HOST`, `PI_*`, `SILO_*`.

## Image variable names

One convention everywhere (GitHub repository variables, workflows, Compose, `.env.example`, `.env.prod.example`, `variables.env`):

- `PLANE_IMAGE_FRONTEND`
- `PLANE_IMAGE_SPACE`
- `PLANE_IMAGE_ADMIN`
- `PLANE_IMAGE_LIVE`
- `PLANE_IMAGE_BACKEND`
- `PLANE_IMAGE_PROXY`

Optional AIO only: `PLANE_IMAGE_AIO`, `PLANE_IMAGE_AIO_FEATURE`.

The complete value includes the tag. Use it verbatim. Never append another tag.

```
PLANE_IMAGE_FRONTEND=hizidan/projects:plane-web-prod
```

Production must set the same six values the Branch Build CE workflow pushed. This repository does not commit those Hub refs.

Missing any required `PLANE_IMAGE_*` now fails interpolation:

```
error while interpolating ... required variable PLANE_IMAGE_BACKEND is missing a value
```

There is no fallback to `makeplane/*`, `*-commercial`, `stable`, `preview`, or `latest` for Plane application images. Official data-store images remain pinned (`postgres:15.7-alpine`, `valkey/valkey:7.2.11-alpine`, `rabbitmq:3.13.6-management-alpine`, `minio/minio:RELEASE.2024-12-18T13-15-44Z`).

## Commercial fallback findings

Before this change, `docker-compose-prod.yml` defaulted to:

- `makeplane/admin-commercial:v3.0.1`
- `makeplane/backend-commercial:v3.0.1`
- `makeplane/web-commercial:v3.0.1`
- `makeplane/space-commercial:v3.0.1`
- `makeplane/live-commercial:v3.0.1`
- `makeplane/proxy-commercial:v3.0.1`
- plus `email-commercial`, `monitor-commercial`, `plane-pi-commercial`, `silo-commercial`, `makeplane/iframely:v2.5.3`

Those defaults are removed. The file is no longer a commercial dump.

## Secrets audit

`.env.prod.example` and the previous `docker-compose-prod.yml` contained values described as restored from the live stack. They are replaced with empty/documentation placeholders.

If any of these committed keys were actually used in production, **rotate them on the host**. This change does not rotate them externally.

- `SECRET_KEY`
- `LIVE_SERVER_SECRET_KEY`
- `AES_SECRET_KEY`
- `MACHINE_SIGNATURE`
- `PI_INTERNAL_SECRET`
- `SILO_HMAC_SECRET_KEY`
- `INSTANCE_ID`
- `WEBHOOK_SECRET`
- any OAuth / API secrets that were stored beside them

An untracked local dump (`docker-compose-prod-origin.yml`) still hardcodes the same values. It is gitignored. Do not commit it.

## Build SHA / digest mechanism

At Docker build time each Plane app image receives non-secret OCI labels and matching build-args:

- `org.opencontainers.image.revision` = `github.sha`
- `org.opencontainers.image.source` = `https://github.com/<repository>`
- `org.opencontainers.image.created` = UTC timestamp

The image tag is unchanged: it remains the exact GitHub variable value.

The backend also sets `PLANE_GIT_REVISION`. The API entrypoint logs `Plane backend revision=...`. `GET /api/instances/` exposes `config.build_revision` (or top-level `build_revision` before setup). No secrets are included.

Branch Build CE now:

1. checks out `ref: ${{ github.sha }}`;
2. prints that SHA and each destination image ref;
3. builds from that checkout;
4. pushes exactly that ref;
5. records the pushed digest;
6. prints `component -> ref -> digest -> source SHA`.

Registry layer cache is kept. Application `COPY` layers invalidate when the checkout changes, so cache cannot substitute stale source for `github.sha`.

## Production verification commands

On the VPS, after copying the new Compose files and setting the six `PLANE_IMAGE_*` values:

```bash
docker compose -f docker-compose-prod.yml config --images
docker compose -f docker-compose-prod.yml ps

docker inspect web --format '{{.Config.Image}} {{.Image}}'
docker inspect api --format '{{.Config.Image}} {{.Image}}'

docker image inspect "$PLANE_IMAGE_FRONTEND" \
  --format '{{json .Config.Labels}}'
docker image inspect "$PLANE_IMAGE_BACKEND" \
  --format '{{json .Config.Labels}}'
```

Compare `.Image` (digest) to the digest printed by the GitHub Actions **Report image identity** job. A matching tag is not sufficient.

```bash
curl -sS https://<APP_DOMAIN>/api/instances/ | python3 -m json.tool
```

Expect `config.build_revision` to equal the built SHA after the next backend image roll. Current production (before this image rebuild) has no `build_revision` field.

Coordinated deploy only, after every component build succeeds:

```bash
docker compose -f docker-compose-prod.yml pull
docker compose -f docker-compose-prod.yml up -d
```

Then recreate — do not leave old containers running under the same name.

## Policy endpoint result

Live `GET https://plane.aitech.net.au/api/instances/` at investigation time:

| Field                                   | Value                                                   |
| --------------------------------------- | ------------------------------------------------------- |
| `capabilities.policy.self_hosted`       | `true`                                                  |
| `capabilities.policy.commercial_gating` | `false`                                                 |
| `capabilities.policy.feature_tier`      | `"unlimited"`                                           |
| `capabilities.policy.seat_limit`        | `null`                                                  |
| `capabilities.policy.member_limit`      | `null`                                                  |
| `capabilities.policy.project_limit`     | `null`                                                  |
| `config.is_self_managed`                | `true`                                                  |
| `instance.edition`                      | `PLANE_COMMUNITY`                                       |
| `instance.current_version`              | `v3.0.1` (stale `APP_VERSION` from the commercial dump) |

Community backend hardcodes `IS_SELF_MANAGED = True` in `apps/api/plane/settings/common.py`. If production ever stops returning this policy, the cause is a wrong backend image, leftover commercial env/`APP_VERSION` confusion, or a container that was not recreated — not a frontend hide.

## Known feature fingerprints

Production web manifest already registers Community routes:

- `/:workspaceSlug/settings/worklogs`
- `/:workspaceSlug/settings/imports/jira`
- `/:workspaceSlug/active-cycles`

The Import Hub chunk includes Jira / Linear / Asana / ClickUp cards and the unavailable modal. Settings JS does not contain Teamspaces / Initiatives / Customers / Connections / Templates product routes.

Manual UI (after the coordinated image roll):

1. Workspace Settings → Features → Worklogs only.
2. Import Hub five cards; Jira Cloud route works; others show unavailable (not Upgrade).
3. Active Cycles under More / customize navigation.
4. Billing self-hosted CTAs follow `useSelfHostedPolicy()` (`!hasCommercialGating`).
5. Power K page search does not navigate to `/wiki/...`.
6. Work-item selection shows bulk archive for Admin/Member.
7. Project Estimates includes TIME on self-hosted.

If those fingerprints disappear while the image SHA/digest still matches the GitHub build, investigate build/cache contamination — do not add missing commercial domains.

## Watchtower decision

Watchtower is **disabled** for Plane application containers in this phase.

- Removed `com.centurylinklabs.watchtower.enable=true` labels.
- Removed the `watchtower` service from root and Community installer Compose.

Mutable production tags remain (the GitHub variable values). That is acceptable only with an explicit coordinated `pull` + `up` after all component builds succeed. Partial publication must not roll production.

## Compose validation

```bash
# fail-fast without image vars
docker compose -f docker-compose.yml config --quiet
# required variable PLANE_IMAGE_BACKEND is missing a value

PULL_POLICY=if_not_present SECRET_KEY=test LIVE_SERVER_SECRET_KEY=test \
  PLANE_IMAGE_FRONTEND=example/plane-frontend:tag \
  PLANE_IMAGE_SPACE=example/plane-space:tag \
  PLANE_IMAGE_ADMIN=example/plane-admin:tag \
  PLANE_IMAGE_LIVE=example/plane-live:tag \
  PLANE_IMAGE_BACKEND=example/plane-backend:tag \
  PLANE_IMAGE_PROXY=example/plane-proxy:tag \
  docker compose -f docker-compose.yml config --quiet
# OK

# same vars with -f docker-compose-prod.yml and
# deployments/cli/community/docker-compose.yml: OK
```

Resolved Plane app images are only the supplied refs. No `makeplane/*` application images. No Watchtower service.

## Tests

Backend (Docker), 118 collected:

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_self_hosted_unlimited.py \
  plane/tests/contract/app/test_bulk_issue_archive_app.py \
  plane/tests/contract/app/test_issue_worklogs_app.py \
  plane/tests/unit/utils/test_worklog_export.py \
  plane/tests/contract/app/test_jira_importer_app.py \
  plane/tests/unit/license/test_capabilities.py \
  plane/tests/contract/license/test_instance_capabilities.py \
  plane/tests/contract/app/test_config_dependent_activation.py \
  plane/tests/contract/app/test_workspace_active_cycles_app.py \
  plane/tests/contract/app/test_api_token.py \
  plane/tests/contract/app/test_deploy_board_project_scope_app.py -q
```

Result: **118 passed** in 905.53s. Includes the new `build_revision` assertions on `GET /api/instances/`.

Frontend:

- `oxfmt --check packages/types/src/instance/base.ts`: pass
- `oxlint packages/types/src/instance/base.ts --deny-warnings`: 0 warnings / 0 errors
- `@plane/types` `check:types`: pass
- `web check:format`: pass
- `web check:types`: pass (11 tasks)

Lint API (`ruff check --fix apps/api`, line-length 120) failed on the first PR push because this branch touches `apps/api/**` and the job lints the whole tree. Remaining failures were E501 wraps in importer/cycle/Jira/worklog/capabilities tests. Those lines are wrapped; local `ruff check --select E501 apps/api` is clean.

## Remaining source-absent features

Do not fabricate these. Do not import proprietary EE source.

- Templates (work-item / project)
- Initiatives
- Teamspaces as an entity (Active Cycles is not a Teamspace)
- Standalone Wiki (`/wiki`)
- Customers
- Connections product
- Custom dashboards
- Pi Chat as a workspace app
- GitHub/Slack integration management APIs
- Jira Server/DC, Linear, Asana, ClickUp importer backends
- SAML/OIDC/LDAP/SCIM
- Backup/restore UI
- Generic automation beyond project auto-archive/auto-close

If an equivalent exists on a legitimate open-source upstream branch/tag, sync that separately after documenting the source. This PR does not do that.

## Files changed

- `docker-compose.yml` — Community production topology; fail-fast images; Watchtower removed
- `docker-compose-prod.yml` — include alias of `docker-compose.yml`
- `.env.prod.example` — placeholders only; rotation notice
- `.env.example`, `deployments/cli/community/variables.env` — Watchtower removed
- `deployments/cli/community/docker-compose.yml`, `build.yml`, `README.md`
- `.github/workflows/build-branch.yml`
- `.github/actions/build-push-image/action.yml`
- Dockerfiles: `apps/{web,admin,space,live,api,proxy}`, `deployments/aio/community`
- `apps/api/bin/docker-entrypoint-api.sh`
- `apps/api/plane/license/api/views/instance.py`
- `apps/api/plane/tests/contract/license/test_instance_capabilities.py`
- `apps/api/plane/tests/contract/app/test_self_hosted_unlimited.py`
- `apps/api/plane/tests/unit/license/test_capabilities.py`
- `apps/api/plane/tests/contract/app/test_{bulk_issue_archive,issue_worklogs,jira_importer,workspace_active_cycles}_app.py`
- `apps/api/plane/app/urls/importer.py`, `views/workspace/cycle.py`, `bgtasks/jira_import_task.py` (E501 only)
- `packages/types/src/instance/base.ts`
- `docs/implementations/p9b-production-image-integrity.md`

## Out of scope

Building missing commercial domains, porting EE source, faking license/billing, rotating production secrets on the host, merging this PR.
