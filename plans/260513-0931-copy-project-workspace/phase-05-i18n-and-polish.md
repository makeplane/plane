# Phase 05 — i18n, Loading States, Error Handling, Polish

## Overview

- **Priority:** P2 (blocked by Phase 03 + 04)
- **Status:** complete
- **Effort:** 3h
- **Description:** Complete translation keys across en/ko/vi, polish loading/error UX, add E2E smoke test.

## Context Links

- i18n rules: `.claude/rules/i18n-rules.md` — TypeScript translation modules, NOT JSON
- Locales: `packages/i18n/src/locales/en/translations.ts`, `ko/translations.ts`, `vi/translations.ts`
- Toast pattern: `.claude/rules/dialogs-modals.md` (Toast Pattern section)

## Requirements

### Functional

- Translation keys added in all 3 locales (en, ko, vi) under `project_copy` namespace
- Loading state on submit (Button `loading={isSubmitting}`)
- Disabled state for inputs while submitting
- Inline error on identifier conflict
- Success toast with link "Open project" navigating to `/{target_workspace_slug}/projects/{new_project_id}/issues`
- Error toast on failure with `job.error` text
- Empty-state: if no admin workspaces (other than source), modal shows informational message instead of picker

### Non-Functional

- Zero hardcoded user-facing strings
- All toasts use `setToast` from `@plane/propel/toast`
- Identifier regex shared via `@plane/constants` to keep frontend + backend in sync

## Architecture

### Translation key tree (en/translations.ts addition)

```typescript
project_copy: {
  menu: { copy_to_workspace: "Copy to workspace" },
  modal: {
    title: "Copy project to another workspace",
    description: "Choose a target workspace and identifier. Issues, modules, cycles, labels, and pages will be copied. Assignees and attachments are not included.",
    target_workspace_label: "Target workspace",
    target_workspace_placeholder: "Select a workspace",
    target_name_label: "Project name",
    target_identifier_label: "Project identifier",
    target_identifier_hint: "Uppercase letters and numbers, max 12 characters",
    no_admin_workspaces: "You aren't an admin of any other workspace. Copying requires admin rights in the target workspace.",
    submit: "Start copy",
    cancel: "Cancel",
  },
  toast: {
    started_title: "Copy started",
    started_message: "We're copying the project in the background. You'll be notified when it's done.",
    completed_title: "Project copied",
    completed_open: "Open project",
    failed_title: "Copy failed",
  },
  error: {
    identifier_taken: "Identifier already used in target workspace",
    identifier_invalid: "Identifier must be 1-12 uppercase letters or numbers",
    name_required: "Name is required",
    workspace_required: "Target workspace is required",
    generic: "Something went wrong. Please try again.",
  },
  status: {
    queued: "Queued",
    processing: "Copying...",
    completed: "Completed",
    failed: "Failed",
  },
}
```

### Identifier regex constant (packages/constants/src/project.ts)

```typescript
export const PROJECT_IDENTIFIER_REGEX = /^[A-Z0-9]{1,12}$/;
export const PROJECT_IDENTIFIER_MAX_LENGTH = 12;
```

### Toast on poll-complete (in modal or wherever startCopy is called)

```typescript
await startCopy(slug, project.id, data, (job) => {
  if (job.status === "completed" && job.new_project_id) {
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("project_copy.toast.completed_title"),
      actionItems: (
        <Link to={`/${job.target_workspace_slug}/projects/${job.new_project_id}/issues`}>
          {t("project_copy.toast.completed_open")}
        </Link>
      ),
    });
  } else if (job.status === "failed") {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("project_copy.toast.failed_title"),
      message: job.error || t("project_copy.error.generic"),
    });
  }
});
```

## Related Code Files

### To Modify

- `packages/i18n/src/locales/en/translations.ts` — add `project_copy` namespace
- `packages/i18n/src/locales/ko/translations.ts` — add `project_copy` (English placeholder, flag for translation)
- `packages/i18n/src/locales/vi/translations.ts` — add `project_copy` (English placeholder)
- `packages/constants/src/project.ts` — add `PROJECT_IDENTIFIER_REGEX`
- `apps/web/ce/components/projects/copy-project-modal.tsx` — replace any hardcoded strings + import regex
- `apps/api/plane/app/views/project/copy.py` — replace hardcoded regex with shared constant if mirrored on Python side (or hard-pin and document)

### To Read for Context

- Existing namespace structure in `packages/i18n/src/locales/en/translations.ts`

## Implementation Steps

1. Add `project_copy` namespace to `en/translations.ts`
2. Copy same tree to `ko/translations.ts` and `vi/translations.ts` (English text — TODO comment for native translation)
3. Add `PROJECT_IDENTIFIER_REGEX` constant
4. Refactor modal to import regex + use `t()` everywhere
5. Add empty-state for "no admin workspaces"
6. Wire poll-complete callback for success/failure toasts
7. Grep modal/menu files for residual hardcoded strings:
   ```bash
   grep -nE '"[A-Z][a-z].*"' apps/web/ce/components/projects/copy-project-*.tsx | grep -v "import\|className\|//"
   ```
8. Run `pnpm check:lint` + `pnpm check:format`
9. Add Playwright/E2E smoke test (if E2E infra exists): admin opens modal → submits → polls → sees toast

## Todo List

- [x] Add en translation keys
- [x] Add ko translation keys (placeholder text)
- [x] Add vi translation keys (placeholder text)
- [x] Add `PROJECT_IDENTIFIER_REGEX` constant
- [x] Refactor modal for `t()` everywhere
- [x] Wire empty-state for no-admin-workspaces
- [x] Wire poll-complete toasts (success + failure)
- [x] Grep for hardcoded strings — zero residual
- [x] `pnpm check:lint` clean
- [x] `pnpm check:format` clean
- [x] Smoke test in dev — full flow works end-to-end

## Success Criteria

- Zero hardcoded user-facing strings in copy-project-modal, picker, menu item
- All 3 locale files contain `project_copy` namespace with matching key tree
- Identifier regex identical between frontend constant + backend validation
- Success toast contains working link to new project
- Failure toast surfaces backend error text
- Empty admin-workspaces state renders informational message
- Lint + format clean

## Risk Assessment

| Risk | Mitigation |
|---|---|
| ko/vi placeholders shipped untranslated | Use English placeholder + add TODO comment; flag for translation team |
| Toast Link component navigates outside React Router context | Use `react-router`'s `<Link>`, verify in toast `actionItems` slot |
| Regex divergence between frontend and Python | Document both in shared comment; or move backend validation to read from frontend constants file via build step (V2) |
| i18n key collision with existing keys | Use unique `project_copy` namespace; grep before adding |

## Security Considerations

- Backend `error` field surfaced in toast — sanitize on backend (no stack traces in production)

## Next Steps

- Feature complete. Open PR for review.
- Future V2: assignee mapping by email, attachment copy, member transfer, progress percentage, email notification.
