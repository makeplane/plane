# P3B Admin Capability Readiness

## Summary

P3B adds a read-only Admin readiness page for self-hosted operators. The page consumes the P3A `capabilities` object from `GET /api/instances/` and displays operational capability state without independently interpreting environment variables or exposing secrets.

## Scope

Included:

- Admin readiness page under the existing Admin dashboard settings area.
- Read-only display for SMTP, object storage, OAuth providers, AI, telemetry, public projects, and supported project capability implementations.
- Guidance for missing configuration and optional services.
- Documentation of capability semantics and secret handling.

Excluded:

- New backend capability fields or endpoints.
- Secret editing or secret migration.
- Provider health checks, SMTP tests, S3 bucket probes, OAuth calls, or LLM calls.
- Bulk work-item exposure, Active Cycles, importers, dashboards, automation, templates, custom fields, MFA/OIDC, portfolio planning, and custom reports.

## Baseline / P3A Dependency

The repository default/base branch is `preview`. P3A PR #1 was merged into `preview` before P3B began, and `origin/preview` contains:

- `apps/api/plane/license/utils/capabilities.py`
- `apps/api/plane/license/api/views/instance.py`
- `packages/types/src/instance/capabilities.ts`
- `docs/implementations/p3a-capability-configuration-normalization.md`

P3B builds on that implementation and does not reimplement the capability resolver.

## Admin Architecture Reused

- Reused the existing Admin React Router dashboard layout in `apps/admin/app/(all)/(dashboard)/layout.tsx`.
- Added the page to `apps/admin/app/routes.ts` and the existing sidebar menu in `apps/admin/hooks/use-sidebar-menu/core.ts`.
- Reused `PageWrapper` for page structure.
- Reused the existing `InstanceProvider` and `InstanceStore`, which already fetch instance boot state from `GET /api/instances/`.
- Reused existing UI primitives: `Loader` and `Badge`.

Location decision: a new `Readiness` page was added inside the existing Admin settings sidebar because no existing single page represented cross-cutting instance capability status. A new top-level Admin section was not added.

## UI Design

The page is available at:

```text
/readiness/
```

It groups capabilities into operational sections:

- Communication
- Storage
- Authentication
- AI
- Instance services
- Supported project capabilities

Each row includes a text status badge and explanatory guidance. Status is not color-only; labels such as `Ready`, `Not configured`, `Disabled`, and `Available` are always rendered as text.

## Capability States Displayed

- SMTP / email: `available`, `enabled`, `configured`, `ready`.
- Object storage: `available`, `configured`, `ready`.
- OAuth providers: Google, GitHub, GitLab, and Gitea with `available`, `enabled`, `configured`, `ready`.
- AI assistant: `available`, `enabled`, `configured`, `ready`.
- Telemetry: `available`, `enabled`.
- Public projects / Space: `available`, `enabled`.
- Project capabilities: cycles, modules, views, pages, intake as implementation availability only.

## Configuration Guidance

The page gives high-level operator guidance:

- SMTP requires existing Email settings or deployment configuration.
- Object storage requires S3-compatible or MinIO deployment configuration.
- OAuth providers require provider client configuration through Authentication settings or deployment configuration.
- AI requires LLM provider/model/API credential configuration through existing AI settings or deployment configuration.
- Telemetry is optional and not required for core work management.
- Project capability availability is not the same as per-project enablement.

The UI does not list every environment variable name. Exact deployment keys remain in operator/deployment documentation and the existing Admin configuration forms.

## Secret Handling

- The readiness page consumes only P3A sanitized capability state.
- It does not call `fetchInstanceConfigurations()` and does not fetch raw admin configuration values.
- It does not display SMTP passwords, OAuth client secrets, S3 access keys, S3 secret keys, LLM API keys, or masked credentials.
- It does not introduce a new secret database, secret API, encryption model, or credential editing mechanism.

## Backend Changes

No backend runtime changes were required for P3B. The existing P3A `/api/instances/` response supplies the necessary state.

## Frontend Changes

- Added the Admin readiness route.
- Added a sidebar entry for `Readiness`.
- Added `apps/admin/app/(all)/(dashboard)/readiness/page.tsx`.
- Stored `capabilities` in the existing Admin instance store as observable state.

## Tests

No Admin frontend test framework is configured in this repository. `apps/admin/package.json` has format, lint, type, build, dev, preview, and start scripts, but no `test` script and no `vitest`/`jest`/Testing Library setup for Admin.

P3B validation therefore uses targeted format/lint/type/build checks. Existing P3A backend tests remain the relevant backend coverage because no backend runtime changes were made.

## CI Discovery

This checkout contains no `.github/workflows/*` files. Therefore no GitHub Actions workflow can be triggered by the P3B PR from this repository state.

Classification: Case A, no CI workflow files exist in the checkout.

## Security Review

- Admin authentication remains handled by the existing dashboard layout and user/session store.
- No Admin access checks were weakened.
- No workspace/project permission logic changed.
- No tenant-scoped API or query changed.
- No secrets are fetched or rendered by the readiness page.
- No provider network calls or fake health checks were added.
- No paid-plan, subscription, billing, entitlement, license bypass, or upgrade logic was added.
- No incomplete roadmap features are displayed.

## Compatibility Review

- Existing Admin pages and routes remain unchanged except for the new sidebar item and route.
- Existing Email, Authentication, AI, General, Workspace, and Image configuration pages continue to own editing behavior.
- Existing project feature toggles remain project-scoped.
- Existing P3A API contract is reused without change.
- No database migration is required.

## Files Changed

- `apps/admin/app/routes.ts`
- `apps/admin/app/(all)/(dashboard)/readiness/page.tsx`
- `apps/admin/hooks/use-sidebar-menu/core.ts`
- `apps/admin/store/instance.store.ts`
- `docs/implementations/p3b-admin-capability-readiness.md`

## Deferred Work

- Bulk work-item exposure.
- Active Cycles.
- Importers.
- Dashboards.
- Automation.
- Templates.
- Custom fields.
- MFA/OIDC/SAML/LDAP/SCIM.
- Portfolio planning and custom reports.
- Deeper operator policy inventory for throttles, upload limits, pagination, workers, retention, and live-service capacity.

## Validation Results

- Passed: `pnpm exec oxfmt --check apps/admin/app/routes.ts "apps/admin/app/(all)/(dashboard)/readiness/page.tsx" apps/admin/hooks/use-sidebar-menu/core.ts apps/admin/store/instance.store.ts docs/implementations/p3b-admin-capability-readiness.md`.
- Passed: `pnpm exec oxlint apps/admin/app/routes.ts "apps/admin/app/(all)/(dashboard)/readiness/page.tsx" apps/admin/hooks/use-sidebar-menu/core.ts apps/admin/store/instance.store.ts --deny-warnings`.
- Passed: `pnpm --filter=admin check:types` with existing Vite/Node warnings.
- Passed: `pnpm --filter=admin build` with existing Vite/React Router warnings.
- Blocked: `npx react-doctor@latest --verbose --diff` could not install/resolve because npm reported `No matching version found for @oxc-project/types@^0.142.0`.
- Backend focused tests were not run because P3B made no backend runtime changes. The repo-supported Docker test path requires `apps/api/.env`; `ls apps/api/.env` reported the file is missing. The documented prerequisite is `./setup.sh`, which creates environment files and was not run automatically to avoid generating unrelated local configuration changes.
