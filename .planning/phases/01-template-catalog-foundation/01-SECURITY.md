---
phase: 01
slug: template-catalog-foundation
status: verified
threats_open: 0
asvs_level: 1
block_on: high
created: 2026-06-30
updated: 2026-06-30T07:14:00Z
---

# Phase 01 - Security

Per-phase security contract: threat register, accepted risks, and audit trail.

## Trust Boundaries

| Boundary                                         | Description                                                                       | Data Crossing                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| authenticated client -> workspace catalog API    | User-controlled workspace slug and API requests cross into DRF viewset code.      | Workspace slug, template metadata, payload JSON           |
| serializer -> database                           | Template payload and metadata cross from request validation into persisted rows.  | ProjectTemplate fields and payload JSON                   |
| migration seed -> database                       | Built-in catalog data is written as global system records.                        | Built-in template rows                                    |
| workspace role -> mutation boundary              | Workspace role membership determines who can change reusable templates.           | Authenticated user role, workspace mutation request       |
| built-in row -> custom copy                      | Global read-only template data is copied into a workspace-scoped mutable record.  | Built-in payload copied into custom template              |
| serializer validation -> future project creation | Template payloads saved in Phase 1 will be consumed by Phase 2 transaction logic. | Validated states, labels, modules, cycles, starter issues |

## Threat Register

| Threat ID | Category               | Component                              | Severity | Disposition | Mitigation                                                                                                                                                                  | Status |
| --------- | ---------------------- | -------------------------------------- | -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T-01-01   | Tampering              | `validate_project_template_payload`    | high     | mitigate    | Strict validation rejects invalid shape, enum values, duplicate keys, default-state errors, and dangling starter issue references before save. Covered by serializer tests. | closed |
| T-01-02   | Information Disclosure | `WorkspaceProjectTemplateViewSet.list` | medium   | mitigate    | List queryset returns only active global built-ins plus active custom templates scoped to `workspace__slug`; guests are denied by `allow_permission`.                       | closed |
| T-01-03   | Tampering              | `seed_builtin_project_templates`       | medium   | mitigate    | Migration uses `update_or_create` keyed by stable `system_key`, `is_system=True`, and `workspace__isnull=True`, leaving custom copies untouched.                            | closed |
| T-01-04   | Elevation of Privilege | write endpoints                        | high     | mitigate    | Create, patch, delete, and duplicate handlers use `@allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")`; member and guest 403 contract tests pass.             | closed |
| T-01-05   | Tampering              | custom write queryset                  | high     | mitigate    | `_get_writable_template` rejects built-ins with 400 and returns 404 for inactive, missing, global, or foreign workspace rows.                                               | closed |
| T-01-06   | Tampering              | duplicate endpoint                     | medium   | mitigate    | Duplicate creates a new workspace custom row with `is_system=False` and `system_key=None`; source built-in remains unchanged.                                               | closed |
| T-01-07   | Repudiation            | custom template lifecycle              | low      | accept      | Existing `BaseModel` created/updated audit fields are used; full version history remains out of scope for Phase 1.                                                          | closed |
| T-01-08   | Tampering              | payload hardening                      | high     | mitigate    | Hardening tests verify deterministic validation for malformed payload structures before persistence.                                                                        | closed |
| T-01-09   | Information Disclosure | detail/write lookup behavior           | medium   | mitigate    | Cross-workspace PATCH and DELETE return 404 and leave foreign rows unchanged.                                                                                               | closed |
| T-01-10   | Elevation of Privilege | write endpoints                        | high     | mitigate    | Contract tests prove member and guest writes return standard 403 responses across create, patch, delete, and duplicate.                                                     | closed |
| T-01-11   | Denial of Service      | payload size and structure             | low      | accept      | Phase 1 uses structured payload validation; broader request-size controls remain with existing Django middleware/settings.                                                  | closed |
| T-01-SC   | Tampering              | package installs                       | low      | accept      | No npm, pip, or cargo package installs were introduced by Phase 1 implementation.                                                                                           | closed |

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale                                                                                                       | Accepted By         | Date       |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------- | ------------------- | ---------- |
| R-01-01 | T-01-07    | Full template version history is out of scope; existing model audit fields are sufficient for Phase 1.          | GSD security review | 2026-06-30 |
| R-01-02 | T-01-11    | Payload size limits are handled by existing platform controls; Phase 1 adds deterministic structure validation. | GSD security review | 2026-06-30 |
| R-01-03 | T-01-SC    | No package installation occurred in this phase, so supply-chain risk did not expand.                            | GSD security review | 2026-06-30 |

## Evidence

- `apps/api/plane/app/views/workspace/project_template.py` uses workspace-scoped query filters, role decorators, built-in mutation rejection, and soft deactivation.
- `apps/api/plane/app/serializers/project_template.py` validates payload shape and prevents API-created built-in rows.
- `apps/api/plane/db/migrations/0122_projecttemplate.py` seeds only global system templates by stable key.
- `apps/api/plane/tests/unit/serializers/test_project_template.py`, `apps/api/plane/tests/unit/models/test_project_template.py`, and `apps/api/plane/tests/contract/app/test_project_templates_app.py` passed in targeted Docker verification on 2026-06-30.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By                 |
| ---------- | ------------- | ------ | ---- | ---------------------- |
| 2026-06-30 | 12            | 12     | 0    | Codex GSD secure-phase |

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-30
