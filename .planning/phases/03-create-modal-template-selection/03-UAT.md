---
status: complete
phase: 03-create-modal-template-selection
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md
started: 2026-07-01T06:51:21Z
updated: 2026-07-01T13:18:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Open Create Project Modal

expected: Create Project modal opens. A compact template selector sits in the cover/header area showing a "Template" button (project icon + chevron). Default state is no template selected.
result: pass

### 2. Open Selector and Search

expected: Clicking the selector opens a dropdown with a search box and a list of templates. Each row shows the template name plus an optional description line — no badges, group headers, "system" tags, or counts. Typing in search filters the list.
result: pass

### 3. Select a Template

expected: Clicking a template closes the dropdown and the button now shows the selected template's name (not "Template"). Selection changes silently — no confirmation dialog, warning, or toast.
result: pass

### 4. Clear Selection (No template)

expected: Reopening the selector offers a "No template" option. Choosing it clears the selection and the button returns to showing "Template". Again, no dialog or toast.
result: pass

### 5. Create Project WITH a Template

expected: Select a template, fill required fields, submit. Project is created successfully and the create request includes the selected template_id (the created project reflects the template's structure — states, labels, modules, cycles, starter work items, intakes, saved views, and pages).
result: pass
reported: "Initial pass with major content-depth gap: intake, views, pages, cycles, and work item data were thin or missing. Gap fixed by enriching built-in payloads and applying intakes/views/pages/richer starter work items."

### 6. Create Project WITHOUT a Template

expected: Leave selection as "No template", fill required fields, submit. Project is created successfully with no template applied (empty/default structure). No template_id is required.
result: pass

### 7. Reopen Modal Resets Selection

expected: After creating (or cancelling), open the create Project modal again. The selector resets to "No template" every time — a prior selection does not carry over.
result: pass

### 8. Fallback States Don't Block Creation

expected: While the template catalog is loading (or if it fails / is empty), the selector shows inline "Loading...", "No templates available", or "Could not load templates" with a Retry option. In every one of these states, "No template" stays available and you can still create a Project without a template.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none]

## Resolved During UAT

- truth: "Project created from a template reflects a complete useful project structure, including enough generated content for intake, views, pages, cycles, and starter work items."
  status: resolved
  reason: "User reported that template-created projects were too sparse. Built-in payloads and the apply service now create richer generated content."
  severity: major
  test: 5
  root_cause: "Template schema/apply service only generated states, labels, modules, one cycle, and thin starter issues; it did not support intake, saved views, pages, richer starter issue metadata, or project feature flags."
  fix:
  - "Added optional intakes/views/pages payload sections with validation."
  - "Generated Intake, IssueView, Page, ProjectPage, and PageLabel rows during template application."
  - "Added richer starter issue descriptions and relative dates."
  - "Enabled project feature flags for generated modules, cycles, views, pages, and intakes."
    verification:
  - "docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/unit/serializers/test_project_template.py plane/tests/unit/services/test_project_template_apply.py plane/tests/unit/migrations/test_projecttemplate_migration.py -q"
  - "docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_project_template_creation_app.py -q"
  - "docker compose -f docker-compose-test.yml run --rm api-tests python manage.py migrate"
  - "pnpm --filter=@plane/types check:types"
