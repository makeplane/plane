# P7A Community Import Hub Parity

## Screenshot / parity problem

The expected Community Imports experience is an Import Hub of provider cards (Jira, Jira Server/Data Center, Linear, Asana, ClickUp). After P5B, this fork rendered one always-visible Jira Cloud credential form on `/:workspaceSlug/settings/imports` and filtered history to `service === "jira"`.

P7A restores the card landing page, keeps the working Jira Cloud importer on a dedicated route, and treats the other four cards as Community UI parity until real Community source exists.

## Current Jira-only architecture (before P7A)

- Frontend: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/page.tsx` hosted the P5B form inline.
- Backend (unchanged contract except preview method): list, Jira preview, Jira create, cancel — see `docs/implementations/p5a-jira-importer.md` and `docs/implementations/p5b-jira-importer-frontend.md`.
- History: backend `GET /api/workspaces/:slug/importers/` already returned all services; the UI discarded non-Jira rows.

## Upstream / history audit

Search covered the current tree, `preview` history, and Community paths for `jira`, `jira_server`, `linear`, `asana`, `clickup`, `importer`, `import-service`, import modal/wizard.

| Provider                | Classification                   | What was found                                                                                                                                                 |
| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jira Cloud              | B (partial, closest to complete) | P5A/P5B Community slice: Cloud hostname + REST v3, preview, start, poll, cancel, token redaction, 500-issue cap. No comments/attachments/full user membership. |
| Jira Server/Data Center | D (source absent)                | No Community client. Cloud `normalize_jira_hostname` rejects ports, paths, and non-host values. Cloud email+API token is not assumed valid for Server/DC.      |
| Linear                  | D (source absent)                | Name-only references (copy, estimates, i18n glossary). No importer API, OAuth, or mapping.                                                                     |
| Asana                   | D (source absent)                | Docs/skill mentions only. No importer.                                                                                                                         |
| ClickUp                 | D (source absent)                | No current-tree Community implementation.                                                                                                                      |

Git history contains EE/SILO importer UI under the removed `apps/web/ee/components/importers/` tree (ClickUp, Linear, Notion, Confluence). That code was removed from Community web (`fix: remove ee folder from web`). P7A does **not** retrieve or port proprietary EE/SILO source.

`IMPORTERS_LIST` in `packages/constants/src/workspace.ts` still lists GitHub + Jira and is unused by the hub. GitHub remains out of the five-card Community hub.

Official open-source Community source compatible with this fork does not contain functional Linear, Asana, ClickUp, or Jira Server/DC importers to reuse.

## Provider registry architecture

Shared, non-framework registry in `packages/constants/src/importer.ts`:

- `id`, `service`, i18n label/description, `beta`, `availability` (`available` \| `partial` \| `unavailable`), `launch` (`route` \| `unavailable`), optional `path`.

Frontend:

- `ImportHub` renders cards from the registry.
- Jira `launch: "route"` → `/:workspaceSlug/settings/imports/jira`.
- Unavailable providers open `UnavailableImporterModal` (not Upgrade / Talk to Sales). The copy states the importer is not implemented in this Community source tree.
- `JiraCloudImporter` is the existing P5B form extracted, not rewritten.
- `ImportHistoryList` is provider-neutral.

Icons: existing `jira.svg` for Jira and Jira Server/DC. Linear/Asana/ClickUp use letter marks (no EE brand assets).

## Provider status

| Provider | Community UI | Frontend | Backend | Functional | Follow-Up |
| Jira Cloud | Yes | Complete | Complete (bounded P5 slice) | Complete (bounded P5 slice) | Comments, attachments, users-as-members, >500 issues |
| Jira Server/DC | Yes | Partial (card + unavailable modal) | Source absent | Source absent | Dedicated Server/DC auth, base URL, TLS, pagination, project discovery |
| Linear | Yes | Partial (card + unavailable modal) | Source absent | Source absent | Auth, team discovery, mapping, rate limits |
| Asana | Yes | Partial (card + unavailable modal) | Source absent | Source absent | Auth, project discovery, mapping |
| ClickUp | Yes | Partial (card + unavailable modal) | Source absent | Source absent | Auth, space/list discovery, mapping |

UI parity is not backend availability. Cards stay visible for Community layout; Import does not fake success.

## Jira regression

Preserved:

- hostname, project key, Jira email, API token, destination project, Preview, Start import, status polling, cancellation
- token not in SWR keys (`IMPORTER_SERVICES_LIST_${slug}`), history rows, or persistent browser stores
- stored metadata remains hostname, project_key, email
- SSRF / host validation for Cloud hostnames

P7A change (credential URL leak): Jira preview moved from `GET` with query params to `POST` with a JSON body so the API token is not placed in the request URL. Frontend `JiraImporterService.getJiraProjectInfo` posts the same payload. `GET` now returns 405.

Route: `/:workspaceSlug/settings/imports/jira` registered before the generic imports route. Hub back control returns to the card grid. Imports sidebar highlight includes `/settings/imports/*`.

## History changes

- No `service === "jira"` filter.
- Rows show provider label (registry, GitHub fallback, or raw `service` for unknown providers), source (`project_key` / `name` / `owner`, never email), destination project, status, imported count, timestamp, cancel for queued/processing.
- Unknown future `service` values must not crash the page.

## Credential / security review

- Token lives in React state on the Jira detail page only; cleared after start success and start failure.
- Preview POST body is not cached in SWR.
- Importer history and metadata responses must not contain `api_token` (covered by create + list tests).
- Jira Cloud host validation still rejects ports/paths/`@` (SSRF).
- Email remains in stored Jira metadata (P5A); history UI does not render it.

## RBAC / tenant review

Unchanged from P5A:

- Workspace ADMIN/MEMBER for list, preview, start, cancel.
- Create also requires project ADMIN/MEMBER in the destination project.
- Cross-workspace `project_id` → 404.
- Guests → 403.
- Self-hosted unlimited commercial access does not relax these rules.

## Self-hosted commercial gate audit

Import Hub paths have no Upgrade, PRO, Enterprise, plan, subscription, or entitlement gates. Unavailable providers are source-absent, not paid features. No Talk to Sales. P6 policy is unused here because no commercial gate existed to normalize.

## Tests

Docker:

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_jira_importer_app.py
```

Result: `8 passed in 78.77s`.

`docker-compose-test.yml` `test-mq` no longer mounts a root-owned tmpfs or the full API `.env`. It runs as RabbitMQ uid `100:101` so `.erlang.cookie` is readable on Docker Desktop. That change is test-stack only.

Frontend:

```bash
pnpm --filter @plane/i18n run sync:check
pnpm --filter @plane/constants build
pnpm --filter @plane/constants check:types
pnpm --filter @plane/i18n build
pnpm --filter @plane/i18n check:types
pnpm --filter web check:format
pnpm --filter web check:lint
```

`apps/web` has no unit test script. `pnpm --filter web check:types` is expected to fail on pre-existing `@plane/editor` issues (same as P5B).

## Validation

Manual checklist:

1. Imports landing page shows the five-card grid, not the Jira form.
2. Jira opens the existing importer flow.
3. Back to Import Hub works.
4. History lists all backend services.
5. API token is not in URL, SWR key, or history.
6. Unauthorized users cannot start imports.

## Files changed

- `packages/constants/src/importer.ts` — hub registry
- `apps/web/core/components/importers/*` — hub, cards, history, Jira form, unavailable modal
- `apps/web/app/.../imports/page.tsx` and `imports/jira/*`
- `apps/web/app/routes/core.ts`
- `apps/web/core/services/integrations/jira.service.ts` — preview POST
- `apps/api/plane/app/views/importer/base.py` — preview POST
- `apps/api/plane/tests/contract/app/test_jira_importer_app.py`
- `packages/i18n/src/locales/*/workspace-settings.json`
- `docker-compose-test.yml` — `test-mq` runs as uid `100:101` without tmpfs or the API `.env` so RabbitMQ can start on Docker Desktop
- this report

## Deferred provider work

Do not invent Linear, Asana, ClickUp, or Jira Server/DC backends without Community source. A later phase may add bounded Server/DC (base URL, credential mode, TLS) and other providers only from legitimate Community/open-source implementations.
