---
status: complete
phase: 01-template-catalog-foundation
source:
  - 01-01-SUMMARY.md
  - 01-02-SUMMARY.md
  - 01-03-SUMMARY.md
started: 2026-06-30T04:17:53Z
updated: 2026-06-30T07:14:00Z
---

## Current Test

[testing complete]

## Tests

### 1. List built-in templates as admin

expected: |
GET /api/workspaces/{slug}/project-templates/ as admin returns 200 with a JSON
array of three active global built-ins (Software Project, Marketing Campaign,
Operations Project). Built-ins have workspace=null and is_system=true.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 2. List built-in templates as member

expected: |
GET /api/workspaces/{slug}/project-templates/ as workspace member returns 200
with the same three built-ins. Members can read but cannot write.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 3. List built-in templates as guest

expected: |
GET /api/workspaces/{slug}/project-templates/ as workspace guest returns HTTP 403
from the standard allow_permission helper (Plane permission error body).
Guests cannot list at all in Phase 1.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 4. Create custom template as admin

expected: |
POST /api/workspaces/{slug}/project-templates/ as admin with a valid payload
(schema_version, states, labels, modules, cycles, starter issues) returns 201
with the created custom template. The new row has workspace set to the request
workspace, is_system=false, template_type=custom, system_key=null.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 5. Create custom template as member

expected: |
POST /api/workspaces/{slug}/project-templates/ as workspace member returns HTTP 403.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 6. Create custom template as guest

expected: |
POST /api/workspaces/{slug}/project-templates/ as workspace guest returns HTTP 403.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 7. Update custom template as admin

expected: |
PATCH /api/workspaces/{slug}/project-templates/{pk}/ as admin on a custom
workspace template returns 200 with the updated record (e.g., description changed).
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 8. Soft-deactivate custom template as admin

expected: |
DELETE /api/workspaces/{slug}/project-templates/{pk}/ as admin on a custom
template returns 204. A subsequent GET list excludes the deactivated template,
but the row remains in the database (is_active=false) for audit.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 9. Duplicate a built-in as admin

expected: |
POST /api/workspaces/{slug}/project-templates/{pk}/duplicate/ as admin on a
built-in returns 201 with a new custom copy (template_type=custom, is_system=false,
system_key=null, workspace=current). The source built-in is unaffected.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 10. Admin cannot edit a built-in

expected: |
PATCH /api/workspaces/{slug}/project-templates/{builtin_pk}/ as admin on a
built-in system row returns HTTP 400 with the explicit message
"Built-in templates cannot be modified through custom routes". No DB mutation.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 11. Admin cannot deactivate a built-in

expected: |
DELETE /api/workspaces/{slug}/project-templates/{builtin_pk}/ as admin on a
built-in system row returns HTTP 400 with the same explicit message.
No DB mutation.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 12. Member cannot edit a custom template

expected: |
PATCH on a workspace custom template as workspace member returns HTTP 403.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

### 13. Cross-workspace access returns 404

expected: |
PATCH / DELETE on a template UUID that belongs to a different workspace returns
HTTP 404 from the workspace-scoped writable lookup helper, preventing foreign
template probing.
result: pass
source: automated
evidence: "2026-06-30 targeted backend verification: makemigrations --check --dry-run passed; 78 pytest checks passed."

## Summary

total: 13
passed: 13
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
