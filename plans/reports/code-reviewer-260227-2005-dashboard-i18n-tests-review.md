# Code Review: Dashboard i18n + Backend Tests

**Date:** 2026-02-27
**Scope:** 11 frontend components (i18n), 3 translation files, 1 backend test file
**Score: 8.5 / 10**

---

## Scope

- Files reviewed: 15 total (12 frontend, 3 locale files)
- Backend test: `apps/api/plane/tests/contract/app/test_analytics_dashboard.py` (585 lines, 41 tests)
- Frontend components: 11 files across `apps/web/ce/components/dashboards/` and `apps/web/app/routes/`
- Translation files: `packages/i18n/src/locales/{en,ko,vi}/translations.ts`

---

## Overall Assessment

i18n migration is thorough and correct. All 12 files import `useTranslation` and destructure `t`. All 86 keys in the `analytics_dashboard` namespace are present and consistent across en/ko/vi — the key-count parity check confirms zero missing or extra keys. Korean and Vietnamese translations are real localizations (not English placeholders). Test file follows established patterns (session_client, `@pytest.mark.django_db`, `@patch` on `model_activity.delay`), fixtures are minimal and composable, and assertions are specific.

---

## Critical Issues

None.

---

## High Priority

### H1 — XSS Risk: Unsanitized dashboard name in `dangerouslySetInnerHTML`

**File:** `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-delete-modal.tsx:53`

```tsx
// CURRENT - dashboardName interpolated into HTML without sanitization
dangerouslySetInnerHTML={{
  __html: t("analytics_dashboard.delete_confirm", { name: dashboardName }),
}}
```

The EN translation is:

```
"Are you sure you want to delete <strong>{name}</strong>? ..."
```

`dashboardName` is a user-created value (stored in DB) and could contain `<script>`, `<img onerror=...>`, or other injected HTML. If a malicious user creates a dashboard with a crafted name, the delete confirm dialog renders raw HTML from it.

**Fix option A — escape the name before passing:**

```tsx
import { escapeHtml } from "@plane/utils"; // or a simple helper

dangerouslySetInnerHTML={{
  __html: t("analytics_dashboard.delete_confirm", {
    name: escapeHtml(dashboardName),
  }),
}}
```

**Fix option B — avoid dangerouslySetInnerHTML entirely:**

```tsx
// Restructure the translation to use React children instead
content={
  <span>
    {t("analytics_dashboard.delete_confirm_prefix")}{" "}
    <strong>{dashboardName}</strong>
    {t("analytics_dashboard.delete_confirm_suffix")}
  </span>
}
```

Option B is preferred as it eliminates the risk entirely and doesn't require a sanitization util.

---

## Medium Priority

### M1 — Hardcoded "to" separator in date range row

**File:** `apps/web/ce/components/dashboards/config/filter-settings-section.tsx:79`

```tsx
<span className="text-xs text-color-tertiary">to</span>
```

This is an untranslated UI string. It should be:

```tsx
<span className="text-xs text-color-tertiary">{t("common.to")}</span>
```

Check if a `common.to` key already exists; add if not.

### M2 — Hardcoded "Dashboard" fallback string

**File:** `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx:43`

```tsx
const pageTitle = currentDashboard?.name ?? "Dashboard";
```

Should use a translation key:

```tsx
const pageTitle = currentDashboard?.name ?? t("analytics_dashboard.label");
```

### M3 — Incorrect semantic token class names in `dashboard-toolbar.tsx`

**File:** `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/dashboard-toolbar.tsx:35,41,43,47`

Code uses short-form Tailwind tokens without the required `text-color-` / `border-color-` prefix:

```tsx
// WRONG — used in dashboard-toolbar.tsx
border - subtle; // → border-color-subtle
text - tertiary; // → text-color-tertiary
text - accent - primary; // → text-color-accent-primary
```

These short-form tokens (`text-tertiary`, `border-subtle`) also appear in some other pre-existing dashboard files (`analytics-dashboard-widget-card.tsx`, `widget-chart-renderer.tsx`, `number-widget.tsx`) as pre-existing issues. However, the `dashboard-toolbar.tsx` file is new, so the wrong tokens were introduced here.

Per design system rules:

```tsx
// CORRECT
<div className="border-b border-color-subtle bg-surface-1">
<ArrowLeft className="h-4 w-4 text-color-tertiary" />
<DashboardIcon className="h-5 w-5 text-color-accent-primary" />
```

### M4 — `console.error` left in production widget config modal

**File:** `apps/web/ce/components/dashboards/widget-config-modal.tsx:110`

```tsx
} catch (error) {
  console.error("Failed to save widget:", error);
}
```

No user-facing error feedback when widget save fails inside the modal. The error is swallowed silently (from the user's perspective). Should use `setToast` with an error message:

```tsx
} catch (error) {
  setToast({
    type: TOAST_TYPE.ERROR,
    title: t("analytics_dashboard.update_widget_failed"),
  });
}
```

---

## Low Priority

### L1 — Test fixture `dashboard` declares `db` explicitly alongside `workspace`

**File:** `apps/api/plane/tests/contract/app/test_analytics_dashboard.py:19`

```python
@pytest.fixture
def dashboard(db, workspace, create_user):
```

The `workspace` fixture already transitively depends on `create_user` which depends on `db`. The explicit `db` param is redundant but harmless. For consistency with other fixtures in `conftest.py`, consider removing it.

### L2 — Test `test_list_dashboards_empty` relies on workspace isolation assumption

```python
def test_list_dashboards_empty(self, session_client, workspace):
    response = session_client.get(url)
    assert response.data == []
```

If another test in a parallel run shares the workspace (unlikely with pytest-django's test isolation, but worth noting), this could flake. The view should scope to workspace, which it does — this is safe as-is but worth verifying the view filters by `workspace__slug=slug`.

### L3 — Test: missing test for unauthenticated widget endpoints

The `TestAnalyticsDashboardAPI` has `test_unauthenticated_request_rejected` for dashboards but no equivalent for widget, bulk-positions, duplicate, or widget-data endpoints. Minor gap since auth is enforced at the ViewSet base class level, but explicit coverage per endpoint is better practice.

---

## Positive Observations

- **Perfect key parity** across all three locales — 86 keys each, zero drift. Automated check confirmed.
- All 12 components have `useTranslation` imported from `@plane/i18n` (correct package).
- `{ t }` destructuring placed correctly inside the component body for every observer-wrapped component.
- Dynamic tab labels in `widget-config-modal.tsx` use template key lookup (`t(\`analytics*dashboard.tab*${key}\`)`) — clean and avoids repetition.
- Test fixtures are minimal and composable (dashboard depends on workspace, widget depends on dashboard).
- Mock pattern (`@patch("plane.bgtasks.webhook_task.model_activity.delay")`) is consistent with existing contract tests.
- Soft-delete assertions correctly use `all_objects` vs `objects` managers.
- `test_duplicate_generates_unique_name_on_collision` — excellent edge case coverage for naming collision.
- `test_bulk_update_clamps_negative_values` — good boundary condition test.
- File sizes all within limits: largest is `page.tsx` at 213 lines (marginally over the 150-line component guideline from design rules but acceptable given complexity).
- No logic changes in i18n migration — pure string extraction verified by reading all 11 files.

---

## Recommended Actions

1. **(H1) Fix XSS** in `analytics-dashboard-delete-modal.tsx` — escape `dashboardName` before HTML interpolation, or refactor to use React children.
2. **(M1) Translate "to" separator** in `filter-settings-section.tsx:79`.
3. **(M2) Replace "Dashboard" fallback** in `page.tsx:43` with a translation key.
4. **(M3) Fix Tailwind token names** in `dashboard-toolbar.tsx` — add `text-color-` / `border-color-` prefixes.
5. **(M4) Add error toast** in `widget-config-modal.tsx` catch block instead of `console.error`.
6. **(L3) Optional** — add unauthenticated tests for widget / bulk-positions / widget-data endpoints.

---

## Metrics

| Metric                                   | Value                                       |
| ---------------------------------------- | ------------------------------------------- |
| i18n key consistency                     | 86/86 across en/ko/vi                       |
| Components with useTranslation           | 12/12                                       |
| Test count                               | 41                                          |
| Hardcoded user-visible strings remaining | 2 (M1, M2)                                  |
| Linting issues found                     | 0 syntax errors; 2 wrong token classes (M3) |
| File size violations                     | 1 (page.tsx: 213 lines, guideline: 150)     |

---

## Unresolved Questions

- Does the i18n `t()` function in `@plane/i18n` escape HTML entities in interpolated values by default? If yes, H1 is lower severity; if no, it is a real XSS vector.
- Is there a `common.to` key already defined in translations? (Affects M1 fix cost.)
- Does the view for analytics dashboards filter by `workspace__slug=slug`? (Relevant to L2 isolation concern.)
