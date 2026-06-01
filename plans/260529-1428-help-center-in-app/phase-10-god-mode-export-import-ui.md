# Phase 10 — God Mode Export/Import Bundle Buttons

## Context Links
- Reuses CLI commands committed `36e8d2be47`: `export_help_center.py`, `import_help_center.py`.
- Backend views: `apps/api/plane/license/api/views/help_center.py`; urls: `license/api/urls/help_center.py`.
- Admin UI: `apps/admin/app/(all)/(dashboard)/help-center/page.tsx`; store `apps/admin/store/instance-help-center.store.ts`; service `packages/services/src/instance-help-center/instance-help-center.service.ts`.
- Precedent (mirror exactly): Staff export/import — `InstanceStaffExportEndpoint` (`license/api/views/staff.py`), `user_bulk_import.py` (MultiPartParser), `instance-staff.service.ts` (blob + FormData), admin `staff/page.tsx` handleExport + `staff-import-modal.tsx`.

## Overview
- Priority: P1 (user-requested). Status: in progress.
- Add Export (download .zip bundle) + Import (upload .zip bundle) buttons to God Mode Help Center, so biz can promote UAT→Prod from the UI without CLI.

## Key Insights
- Default permission of `BaseAPIView` = `InstanceAdminPermission` (role>=15) — inherited, no extra gating code.
- DRY/security: extract export+import core into shared `transfer.py`; CLI + endpoints both call it → the 8 hardened fixes live once.
- Import overwrites matching slugs (intended UAT→Prod push) → confirm modal + warning.

## Requirements
- Functional: GET export → streamed `.zip`; POST import (multipart) → `{categories, articles, images}` stats; UI refetch after import.
- Non-functional: zip-slip guard on import reads, content-type allowlist (reused), bundle size cap 256MB, manifest size cap, English-only admin chrome (NO i18n), semantic tokens only, no `core/` edits, files <200 LOC.

## Architecture / API Contract
- `GET /api/instances/help/export/` → 200 `application/zip`, `Content-Disposition: attachment; filename="help_center_bundle.zip"`; 403 non-admin.
- `POST /api/instances/help/import/` → multipart field `file` (.zip) → 200 `{categories:int, articles:int, images:int}`; 400 `{error}` (missing/invalid/oversize); 403 non-admin.

## Related Code Files
- Create: `apps/api/plane/db/fixtures/help_center/transfer.py`; admin `components/import-bundle-modal.tsx`; backend test `tests/contract/app/test_help_center_transfer_endpoints.py`.
- Modify: `export_help_center.py`, `import_help_center.py`, `loader.py` (use shared `revive_by_slug`); `license/api/views/help_center.py` (+2 views), `license/api/urls/help_center.py` (+2 routes); `instance-help-center.service.ts` (+2 methods), `instance-help-center.store.ts` (+2 actions), `help-center/page.tsx` (header actions), help-center types (+import-result type).

## Implementation Steps
1. `transfer.py`: `revive_by_slug`, `safe_basename`, `build_bundle()->(manifest,assets)`, `apply_bundle(manifest, get_asset_bytes)->stats`. Move the 8 hardened behaviors here.
2. Thin out CLI commands + loader to call `transfer`. Keep CLI args/dir-layout/stdout identical (existing tests lock this).
3. Add 2 views + 2 routes. Export = in-memory zip; Import = MultiPartParser + zip-slip-safe reads + size caps.
4. Frontend service+store+UI; Export = direct blob download; Import = confirm modal (warn overwrite) → stats toast → refetch.
5. Backend view tests (admin-gated, round-trip, zip-slip rejected, oversize rejected). Frontend type-check + lint.

## Todo List
- [x] transfer.py shared core (build_bundle / apply_bundle / safe_basename / revive_by_slug)
- [x] CLI + loader refactor (121 help_center tests green)
- [x] export/import endpoints + routes (admin-gated, live 401 unauth)
- [x] service + store + buttons + import modal (admin check:types + lint + prettier clean)
- [x] backend tests (121 pass: +7 guard/json tests) + frontend typecheck/lint
- [x] adversarial review (4 lenses) + fixes (non-list 400, entry cap, version check, missing-count parity, toast categories)
- [x] route-scoped proxy body limit (3 Caddyfiles, behaviorally verified via httpbin) + docs

## Outcome
Done + verified. No critical/high defects. Route-scoped Caddy `HELP_BUNDLE_MAX_SIZE` (300MB) so UI import of the full guide does not 413; global 5MB unchanged elsewhere. deployment-guide.md documents UI flow + body-size prerequisite + overwrite/orphan caveats.

## Success Criteria
- 91+ existing help_center backend tests stay green; new endpoint tests pass.
- `pnpm check:types` + `check:lint` clean on changed admin/service files.
- Live: Export downloads a valid zip; Import of that zip re-wires images (new asset ids, serve 200).

## Risk Assessment
- Refactor regresses CLI → mitigated by existing `test_help_center_export_import.py` (call_command path).
- Zip bomb / zip-slip on import → size caps + basename-only member reads (never extract to disk).
- Large bundle upload blocked by proxy body limit → document `client_max_body_size` for prod.

## Security Considerations
- Admin-only (InstanceAdminPermission). Re-sanitize HTML on import. Content-type allowlist before put_object. No path traversal (reads constrained to `assets/<basename>` archive members).

## Next Steps
- After merge: document UI flow in `docs/deployment-guide.md` alongside the CLI flow.
