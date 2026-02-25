# Phase 3: Profile UI — Read-only Staff Section

## Context Links

- Profile form: `apps/web/core/components/settings/profile/content/pages/general/form.tsx`
- Profile root: `apps/web/core/components/settings/profile/content/pages/general/root.tsx`
- Hook from Phase 2: `apps/web/ce/hooks/use-my-staff-profile.ts`
- CE override pattern: new components in `ce/` directory
- i18n staff keys: `packages/i18n/src/locales/en/translations.ts` (line ~2814)
- Design system: `@plane/propel` components, semantic color tokens
- Existing Input (read-only): `@plane/ui` Input used in form.tsx with `disabled` prop

## Overview

- **Priority**: P2
- **Status**: complete
- **Description**: Add read-only staff info section (Staff ID, Department, Title/Position) below the profile form fields. Hidden when no StaffProfile exists. Uses CE override pattern.

## Key Insights

- Profile page is at `/profile/` — NOT workspace-scoped in URL. Need `workspaceSlug` from user's last/current workspace
- Use `useWorkspace()` hook to get `currentWorkspace?.slug`
- Existing form uses `@plane/ui` `Input` with `disabled` + `cursor-not-allowed` style for read-only (email field pattern at line 362)
- Staff section should visually separate from editable fields — use a distinct section with header
- Section hides completely if `useMyStaffProfile` returns null (no loading skeleton needed — fast endpoint)
- CE override: create component in `ce/components/settings/profile/` and import in form.tsx

## Requirements

### Functional
- Display Staff ID, Department name, Title (Position) as read-only fields
- Fields styled consistently with existing disabled email field
- Section hidden entirely when user has no StaffProfile
- Show loading state briefly while fetching
- Labels use i18n translations

### Non-functional
- Component < 100 lines
- Semantic color tokens only (no hardcoded colors)
- Accessible: disabled inputs have proper labels

## Architecture

```
GeneralProfileSettingsForm (existing, core)
  └── renders <StaffProfileSection /> (new, ce)
        └── useMyStaffProfile(workspaceSlug)
              ├── data exists → show 3 read-only fields in grid
              └── data null → render nothing
```

### Workspace slug resolution
```
Profile page → useWorkspace() → currentWorkspace?.slug
             → pass to useMyStaffProfile(slug)
```

## Related Code Files

### Files to create
1. `apps/web/ce/components/settings/profile/staff-profile-section.tsx` — read-only staff fields component

### Files to modify
1. `apps/web/core/components/settings/profile/content/pages/general/form.tsx` — import and render StaffProfileSection
2. `packages/i18n/src/locales/en/translations.ts` — add profile.staff_info keys (if not already present)
3. `packages/i18n/src/locales/ko/translations.ts` — add same keys (English placeholder)
4. `packages/i18n/src/locales/vi/translations.ts` — add same keys (Vietnamese)

## Implementation Steps

1. **Add i18n keys** to all 3 locale files under `profile` or `staff` namespace:
   ```
   staff.profile_section.title = "Staff Information"
   staff.profile_section.staff_id = "Staff ID"
   staff.profile_section.department = "Department"
   staff.profile_section.position = "Position"
   ```
   Check if existing `staff.staff_id.label` / `staff.position.label` / `department.name.label` keys can be reused first — they likely can, avoiding new keys.

2. **Create `staff-profile-section.tsx`** in `apps/web/ce/components/settings/profile/`:
   ```tsx
   import { observer } from "mobx-react";
   import { useTranslation } from "@plane/i18n";
   import { Input } from "@plane/ui";
   import { useWorkspace } from "@/hooks/store/use-workspace";
   import { useMyStaffProfile } from "@/plane-web/hooks/use-my-staff-profile";

   export const StaffProfileSection = observer(() => {
     const { t } = useTranslation();
     const { currentWorkspace } = useWorkspace();
     const { data: staffProfile, isLoading } = useMyStaffProfile(currentWorkspace?.slug);

     if (isLoading || !staffProfile) return null;

     return (
       <div className="flex flex-col gap-2">
         <h3 className="text-14 font-medium text-color-primary">
           {t("staff.profile_section.title")}
         </h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
           {/* Staff ID */}
           <div className="flex flex-col gap-1">
             <h4 className="text-13 font-medium text-secondary">
               {t("staff.staff_id.label")}
             </h4>
             <Input
               type="text"
               value={staffProfile.staff_id}
               className="w-full cursor-not-allowed rounded-md !bg-surface-2"
               disabled
             />
           </div>
           {/* Department */}
           <div className="flex flex-col gap-1">
             <h4 className="text-13 font-medium text-secondary">
               {t("department.name.label")}
             </h4>
             <Input
               type="text"
               value={staffProfile.department_detail?.name ?? "—"}
               className="w-full cursor-not-allowed rounded-md !bg-surface-2"
               disabled
             />
           </div>
           {/* Position */}
           <div className="flex flex-col gap-1">
             <h4 className="text-13 font-medium text-secondary">
               {t("staff.position.label")}
             </h4>
             <Input
               type="text"
               value={staffProfile.position || "—"}
               className="w-full cursor-not-allowed rounded-md !bg-surface-2"
               disabled
             />
           </div>
         </div>
       </div>
     );
   });
   ```

3. **Integrate into form.tsx** — in `GeneralProfileSettingsForm`, after the existing fields grid (line ~381, after the `</div>` closing the grid) and before the save button:
   ```tsx
   import { StaffProfileSection } from "@/plane-web/components/settings/profile/staff-profile-section";

   // Inside the form, after the fields grid div:
   <StaffProfileSection />
   ```
   Place it between the fields grid and the save `<Button>`, inside the `flex flex-col gap-7` container.

4. **Verify i18n keys exist** — check if these keys already exist from the department/staff management feature:
   - `staff.staff_id.label` → likely exists (line ~2822 in translations.ts)
   - `staff.position.label` → check existing keys
   - `department.name.label` → likely exists (line ~2802)
   - If `staff.profile_section.title` doesn't exist, add "Staff Information" / "Thong tin nhan vien" / "직원 정보"

## Todo List

- [ ] Verify existing i18n keys for staff_id, position, department name labels
- [ ] Add missing i18n keys to en, ko, vi translation files
- [ ] Create `staff-profile-section.tsx` in `ce/components/settings/profile/`
- [ ] Import and render `StaffProfileSection` in form.tsx after fields grid
- [ ] Test: user with StaffProfile sees staff fields
- [ ] Test: user without StaffProfile sees no extra section
- [ ] Test: semantic tokens render correctly in light and dark themes
- [ ] Verify component < 100 lines

## Success Criteria

- Staff info section appears below editable profile fields for users with StaffProfile
- Section hidden for users without StaffProfile (no empty section, no error)
- Fields are read-only (disabled inputs with `!bg-surface-2` styling)
- Labels use i18n translations
- Consistent visual style with existing email field (disabled pattern)
- Works in all themes (light, dark, contrast variants)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `currentWorkspace` null on profile page | Medium | Guard in hook: `if (!workspaceSlug) return` → section hidden |
| i18n key mismatch with existing keys | Low | Verify existing keys before adding new ones |
| Form layout shift when section loads | Low | Section hidden during loading (not skeleton) — minimal shift |

## Security Considerations

- Read-only display — no user input accepted
- Data sourced from authenticated endpoint (user can only see own profile)
- No sensitive fields exposed (phone, notes excluded)

## Next Steps

- Manual QA: test with staff user + non-staff user
- Verify no TypeScript compilation errors
