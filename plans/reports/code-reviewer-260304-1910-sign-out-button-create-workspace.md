# Code Review: Sign Out Button — Create Workspace Page

**Date:** 2026-03-04
**Branch:** triho
**File:** `apps/web/app/(all)/create-workspace/page.tsx`

---

## Scope

- Files: 1 (`apps/web/app/(all)/create-workspace/page.tsx`)
- LOC changed: ~80 (includes layout refactor beyond the stated task scope)
- Focus: sign-out button addition + incidental layout changes

---

## Overall Assessment

The sign-out logic itself is minimal and correct. One **critical issue** exists: `variant="link-danger"` is not a valid propel Button variant and will silently fall back to the default `primary` style, making the button look wrong at runtime. The implementation also deviates from the codebase error-handling pattern used in all other sign-out sites. The layout refactor is a bonus scope change — not strictly asked for, but it aligns with the onboarding page structure.

---

## Critical Issues

### 1. Invalid Button Variant — `"link-danger"` does not exist

**File:** `apps/web/app/(all)/create-workspace/page.tsx:76`

```tsx
<Button variant="link-danger" size="sm" onClick={handleSignOut}>
```

The propel `buttonVariants` CVA in `packages/propel/src/button/helper.tsx` defines **only** these variants:

```
primary | error-fill | error-outline | secondary | tertiary | ghost | link
```

`"link-danger"` is not in the type union. TypeScript should flag this as a type error unless the type is widened somewhere. At runtime, CVA silently drops unknown variants and falls back to the `defaultVariant` (`primary`), rendering a full blue pill button — the opposite of the intended red-text-link appearance.

**The plan (`plan.md`) listed `link-danger` as a confirmed decision, but that variant was never implemented in propel.**

**Fix:** Use `"ghost"` + a custom text-danger class, or use the `"link"` variant with a wrapper `className` for red color:

```tsx
<Button
  variant="link"
  size="sm"
  onClick={handleSignOut}
  className="text-danger-primary hover:text-danger-primary-hover"
>
  <LogOut className="shrink-0 size-3.5 mr-1" />
  {t("sign_out")}
</Button>
```

Or use a plain `<button>` with `getButtonStyling` workaround. Confirm propel's intended way to get a danger-colored link button.

---

## High Priority

### 2. Missing error handling on `signOut()`

**File:** `apps/web/app/(all)/create-workspace/page.tsx:55-58`

```ts
const handleSignOut = async () => {
  await signOut();
  router.push("/");
};
```

Every other `signOut` call in the codebase catches failures and shows a toast:

- `workspace-wrapper.tsx` (L131): `.catch(() => setToast(...))`
- `user-menu-root.tsx` (L41): `.catch(() => setToast(...))`
- `switch-account-modal.tsx` (L43): `.catch(() => setToast(...))`

If the API call fails (network error, 401, etc.), the current implementation silently swallows the error and still pushes to `"/"`, leaving the user in a potentially broken half-signed-out state.

**Fix:** Match the codebase pattern:

```ts
const handleSignOut = async () => {
  await signOut().catch(() =>
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("sign_out.toast.error.title"),
      message: t("sign_out.toast.error.message"),
    })
  );
  router.push("/");
};
```

`setToast` and `TOAST_TYPE` are already used elsewhere in the file's wider codebase; they'd need to be imported. If KISS is a strict constraint here (per plan.md) and the sign-out is truly near-instant (internal API), the team may consciously accept this omission — but it should be an explicit decision, not an oversight.

---

## Medium Priority

### 3. Layout refactor is broader than the stated task

The diff includes a significant restructuring of the entire page layout (new outer `bg-canvas` shell, card with `shadow-md`, responsive adjustments, `PlaneLogo` → `PlaneLockup` swap, `img` sizing changes). This is beyond the scope of "add a sign-out button."

These changes appear intentional and consistent with the onboarding page (`/onboarding/page.tsx`) structure — which is good. However:

- The `PlaneLogo` → `PlaneLockup` swap changes the visual identity in the header.
- The layout restructure removes `sm:` breakpoint-driven sidebar layout in favour of centered card. This changes responsive behavior and warrants a visual regression check.
- `shadow-md border border-subtle` on the outer card adds decoration that was absent in the original — confirm this matches design intent.

No functional regression was introduced, but a visual/UX sign-off is advisable.

### 4. `handleSignOut` is `async` but `await` on `signOut()` followed by `router.push()` can navigate even if signOut rejects

If signOut throws (not returns a rejection — throws synchronously, which is unlikely but possible), the `router.push("/")` still runs. The `.catch()` pattern used elsewhere avoids this more cleanly. See issue #2.

---

## Low Priority

### 5. Import order: `LogOut` from lucide before `Link` from next

Minor — the project's existing convention in this file places third-party imports before Next.js imports. `LogOut` is placed between `mobx-react` and `next/link`, which follows the correct pattern already. No action needed.

---

## Positive Observations

- `signOut` correctly destructured from the existing `useUser()` call — no duplicate hook call.
- `t("sign_out")` key is a valid top-level translation string (`"Sign out"`) present in all locale files.
- `PlaneLockup` is correctly exported from `@plane/propel/icons`.
- `handleSignOut` placed logically between `getMailtoHref` and `onSubmit` — readable ordering.
- `router.push("/")` after signOut is consistent with `switch-account-modal.tsx`.
- Layout refactor follows the onboarding page structure — good consistency step.
- `LogOut` icon sized consistently (`size-3.5`) with the sidebar sign-out button.

---

## Recommended Actions

| Priority | Action                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | Replace `variant="link-danger"` with a valid propel variant (e.g., `"link"` + `className` for danger color, or `"ghost"` + custom class) |
| High     | Add `.catch(() => setToast(...))` to `handleSignOut` consistent with the rest of the codebase                                            |
| Medium   | Visual regression check on layout refactor (responsive breakpoints, `PlaneLockup` vs `PlaneLogo`, card shadow)                           |

---

## Plan Status

- Phase 1 (`phase-01-implement-sign-out-button.md`): implementation done, but two issues need resolution before merging.
- Plan `plan.md` status should remain `in-progress` until the invalid variant is fixed.

---

## Unresolved Questions

1. Does propel have a `link-danger` variant planned or in a newer build? If yes, confirm the build is available in this project. If no, which valid variant should be used for a red-text link button?
2. Was the layout refactor intentional and design-approved, or a side effect of the implementation? Should it be in a separate commit for cleaner history?
3. Is the omission of error toast on sign-out an explicit KISS decision or an oversight? (Plan.md mentions KISS for "no loading state" but doesn't address error handling.)
