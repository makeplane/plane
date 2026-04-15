---
title: "Phase 01 — Implement Sign Out Button"
status: complete
---

# Phase 01: Implement Sign Out Button

## Context Links

- Plan: [plan.md](./plan.md)
- Target file: `apps/web/app/(all)/create-workspace/page.tsx`
- Pattern reference: `apps/web/core/components/onboarding/switch-account-modal.tsx`

## Overview

- **Priority:** P3
- **Status:** pending
- **Description:** Add a "Sign out" button to the header of the create-workspace page, right side, next to the user email.

## Key Insights

- `useUser()` hook already used in the file; exposes `signOut: () => Promise<void>`
- `Button` from `@plane/propel/button` already imported
- `useAppRouter` already imported; `router.push("/")` used for post-sign-out redirect
- Header structure (line 64-69): `flex items-center justify-between` with logo left, email right
- Pattern: destructure `signOut` → call `await signOut()` → `router.push("/")`
- `useTheme` not needed (only used in switch-account-modal for theme reset; not required here)

## Requirements

- "Sign out" button displayed in the page header, right side, next to user email
- On click: sign out user and redirect to `/`
- No loading state required (keep it simple)

## Architecture

No architectural changes. Pure UI addition in existing component.

## Related Code Files

- **Modify:** `apps/web/app/(all)/create-workspace/page.tsx`

## Implementation Steps

1. In the `useUser()` destructure (line 32), add `signOut`:

   ```ts
   const { data: currentUser, signOut } = useUser();
   ```

2. Add `handleSignOut` method after `onSubmit` (around line 56):

   ```ts
   const handleSignOut = async () => {
     await signOut();
     router.push("/");
   };
   ```

3. Add `LogOut` to lucide-react imports (check if already imported, else add it).

4. Replace the email `<span>` in the header (line 68) with a flex container:
   ```tsx
   <div className="flex items-center gap-3">
     <span className="text-13 text-tertiary">{currentUser?.email}</span>
     <Button variant="link-danger" size="sm" onClick={handleSignOut}>
       <LogOut className="shrink-0 size-3.5 mr-1" />
       {t("sign_out")}
     </Button>
   </div>
   ```
   <!-- Updated: Validation Session 1 - variant=link-danger, i18n key t("sign_out"), LogOut icon, no loading state -->

## Todo List

- [x] Destructure `signOut` from `useUser()`
- [x] Add `LogOut` icon import
- [x] Add `handleSignOut` function
- [x] Add Sign Out button next to email in header (variant=link-danger, t("sign_out"), LogOut icon)

## Success Criteria

- "Sign out" button visible in header next to email on `/create-workspace`
- Clicking it logs the user out and redirects to `/`
- No TypeScript/compile errors

## Risk Assessment

- Low risk: isolated UI change, uses established pattern

## Security Considerations

- Sign-out clears session via `authService.signOut` (existing implementation)

## Next Steps

- Verify button styling is consistent with the page design
