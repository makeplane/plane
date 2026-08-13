# P3A Capability & Configuration Normalization

## Summary

P3A adds a backend-authoritative, sanitized instance capability read model for configuration-backed deployment readiness. It describes implementation and configuration state only; it does not introduce plans, subscriptions, entitlements, seat limits, or frontend-only authorization.

## Scope

Included in this phase:

- SMTP/email readiness from existing instance configuration semantics.
- Object storage readiness from existing Django/S3 settings.
- AI readiness from existing LLM provider/key/model configuration.
- OAuth provider readiness for the existing Google, GitHub, GitLab, and Gitea providers.
- Telemetry availability/enabled state from the existing `Instance` field.
- Public project implementation availability.
- Project feature implementation availability for cycles, modules, views, pages, and intake without moving project preferences.

Excluded from this phase:

- Bulk work-item UI exposure.
- Active Cycles.
- Importers.
- Dashboards.
- Generic automation.
- Templates.
- Custom fields.
- MFA, OIDC, SAML, LDAP, or SCIM.
- Any billing, subscription, license bypass, or entitlement logic.

## Architecture Decisions

- Extended the existing instance boot/config read model at `GET /api/instances/` with a new `capabilities` object instead of creating a parallel feature-flag subsystem.
- Added `InstanceCapabilityService` under `plane.license.utils` because this is where instance configuration precedence already lives.
- Reused `get_configuration_value` for environment/database precedence instead of duplicating configuration lookup rules.
- Did not add a database model or migration.
- Kept project feature booleans as project state. The capability response only says their implementations exist globally.
- Kept RBAC separate. Capability readiness is not permission to call action endpoints.

Discrepancy noted: `docs/unlimited-self-hosted-spec.md` describes P3A instance data as admin-only, but the actual code already exposes sanitized instance boot/config state publicly through `GET /api/instances/` using `AllowAny`. P3A follows the existing boot architecture and adds only sanitized capability booleans to that public response; raw secret-bearing configuration remains in the admin-only configuration endpoint.

## Capability Model

Capability fields are semantic and intentionally sparse:

- `available`: the checked-out application contains the implementation surface.
- `enabled`: an instance/admin setting allows use where such a setting exists.
- `configured`: required non-secret configuration facts are present.
- `ready`: the feature has enough local configuration to attempt normal operation. This does not perform network probes.

Capability state is not authorization. Existing DRF permissions, workspace membership checks, project membership checks, tenant scoping, and project preferences remain authoritative.

## Backend Changes

- Added `apps/api/plane/license/utils/capabilities.py`.
- Extended `InstanceEndpoint.get` to include `capabilities` in the existing `/api/instances/` response.
- Derived AI, SMTP, OAuth, and telemetry state from existing instance configuration paths.
- Derived object storage state from existing Django storage settings.
- Did not alter existing AI, SMTP, OAuth, storage, telemetry, public project, project toggle, or authorization behavior.

## API Changes

Extended:

```http
GET /api/instances/
```

The response now includes:

```json
{
  "capabilities": {
    "ai": { "available": true, "enabled": true, "configured": false, "ready": false },
    "smtp": { "available": true, "enabled": false, "configured": false, "ready": false },
    "object_storage": { "available": true, "configured": true, "ready": true },
    "oauth": { "available": true, "providers": {} },
    "telemetry": { "available": true, "enabled": true },
    "public_projects": { "available": true, "enabled": true },
    "project_features": {
      "cycles": { "available": true },
      "modules": { "available": true },
      "views": { "available": true },
      "pages": { "available": true },
      "intake": { "available": true }
    }
  }
}
```

The endpoint does not return API keys, client secrets, SMTP passwords, S3 credentials, or private provider credentials.

## Frontend Foundation

- Added shared capability types in `packages/types/src/instance/capabilities.ts`.
- Added `capabilities` to `IInstanceInfo`.
- Added typed service accessors in the shared instance service and the web instance service.
- Did not add UI, navigation changes, badges, settings forms, or feature exposure.

## Tests Added

- `apps/api/plane/tests/unit/license/test_capabilities.py`
- `apps/api/plane/tests/contract/license/test_instance_capabilities.py`

Coverage includes:

- AI absent/present/invalid configuration and secret non-disclosure.
- SMTP absent/present configuration and secret non-disclosure.
- Object storage present/missing configuration and credential non-disclosure.
- OAuth no providers, one provider, multiple providers, and client-secret non-disclosure.
- Telemetry enabled/disabled.
- Public endpoint schema, status, partial configuration behavior, and secret non-disclosure.

## Security Review

- No secrets are returned by the capability response.
- No credential values are logged.
- Capability state is not used for RBAC and does not grant permissions.
- Tenant isolation is unchanged; capability resolution is instance/deployment level and accepts no workspace/project identifiers.
- Project toggles are unchanged and remain project-scoped.
- Auth/API throttling, upload limits, pagination safeguards, and file-size settings are unchanged.
- No plan, subscription, billing, seat, license-bypass, or entitlement logic was introduced.
- No incomplete roadmap feature is exposed as ready.

## Compatibility Review

- Existing `/api/instances/` fields remain intact; `capabilities` is additive.
- Existing AI behavior is unchanged.
- Existing SMTP behavior is unchanged.
- Existing OAuth behavior is unchanged.
- Existing object storage behavior is unchanged.
- Existing telemetry behavior is unchanged.
- Existing public project behavior is unchanged.
- Existing cycles/modules/views/pages/intake project toggles are unchanged.
- No database migration is required.

## Files Changed

- `apps/api/plane/license/api/views/instance.py`
- `apps/api/plane/license/utils/capabilities.py`
- `apps/api/plane/tests/unit/license/test_capabilities.py`
- `apps/api/plane/tests/contract/license/test_instance_capabilities.py`
- `packages/types/src/instance/capabilities.ts`
- `packages/types/src/instance/index.ts`
- `packages/types/src/instance/base.ts`
- `packages/services/src/instance/instance.service.ts`
- `apps/web/core/services/instance.service.ts`
- `docs/implementations/p3a-capability-configuration-normalization.md`

## Validation Results

- Python syntax check passed: `python3 -m py_compile plane/license/utils/capabilities.py plane/license/api/views/instance.py plane/tests/unit/license/test_capabilities.py plane/tests/contract/license/test_instance_capabilities.py`.
- Frontend formatting passed: `pnpm exec oxfmt --check packages/types/src/instance/capabilities.ts packages/types/src/instance/index.ts packages/types/src/instance/base.ts packages/services/src/instance/instance.service.ts apps/web/core/services/instance.service.ts`.
- Frontend lint passed: `pnpm exec oxlint packages/types/src/instance/capabilities.ts packages/types/src/instance/index.ts packages/types/src/instance/base.ts packages/services/src/instance/instance.service.ts apps/web/core/services/instance.service.ts --deny-warnings`.
- Attempted focused backend tests with `pytest plane/tests/unit/license/test_capabilities.py plane/tests/contract/license/test_instance_capabilities.py`; blocked because `pytest` is not installed on `PATH`.
- Attempted focused backend tests with `python3 -m pytest ...`; blocked because the available Python does not have `pytest` installed.
- Attempted targeted frontend type checks with `pnpm turbo run check:types --filter=@plane/types --filter=@plane/services --filter=web`; timed out after five minutes while building transitive packages. Completed package steps before timeout showed successful builds/checks for `@plane/types`, `@plane/services`, and dependencies reached in that window.

Further validation should use the repository Docker test stack or the configured Python environment.

## Deferred Work

- P3B administrator readiness/status UI and secret governance.
- Bulk work-item operation verification and any UI exposure.
- Active Cycles aggregate.
- Importer backend handlers/jobs.
- Dashboard backend contract.
- Generic automation engine.
- Templates.
- Custom fields.
- MFA and OIDC/SAML/LDAP/SCIM.
- Operator policy inventory for throttles, upload limits, pagination, workers, and retention.

## Known Limitations

- Capability readiness uses configuration inspection only and does not perform provider network checks, SMTP handshakes, S3 bucket probes, or LLM calls.
- Object storage readiness reflects the existing settings surface, including defaults, and does not prove bucket access.
- AI provider readiness follows the existing configured provider/model list; it does not redesign provider adapters.
- The public boot endpoint remains public because that is the existing application architecture.
- The requested PR base branch `main` was not available in the configured remotes; this checkout's default branch is `preview`.
