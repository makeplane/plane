# Phase 2: Frontend Service + Hook

## Context Links

- Staff service: `apps/web/ce/services/staff.service.ts`
- IStaff interface: defined in `apps/web/ce/services/staff.service.ts` (lines 11-41)
- Profile store: `apps/web/core/store/user/profile.store.ts`
- Profile general root: `apps/web/core/components/settings/profile/content/pages/general/root.tsx`
- useUser hook: `apps/web/core/hooks/store/user/`

## Overview

- **Priority**: P2
- **Status**: complete
- **Description**: Add `getMyStaffProfile()` to StaffService and create a `useMyStaffProfile` hook for fetching/caching current user's staff profile data.

## Key Insights

- Profile page is NOT workspace-scoped in routing — but user has a "last workspace" context available via `useWorkspace()` hook or user settings
- Simpler approach: create a standalone React hook with `useState`/`useEffect` rather than extending MobX ProfileStore (avoids coupling staff data to core profile store)
- The hook should accept `workspaceSlug` and return `{ data, isLoading, error }` pattern
- IStaff type already exists in staff.service.ts — reuse subset for response type

## Requirements

### Functional
- `StaffService.getMyStaffProfile(workspaceSlug)` calls `GET /api/workspaces/{slug}/me/staff-profile/`
- `useMyStaffProfile(workspaceSlug)` hook fetches on mount, caches in local state
- Returns null gracefully on 404 (no staff profile)

### Non-functional
- No new MobX store — lightweight hook is sufficient for read-only display
- Type-safe response interface

## Architecture

```
StaffService.getMyStaffProfile(slug)
  → GET /api/workspaces/{slug}/me/staff-profile/
  → Returns IMyStaffProfile | null

useMyStaffProfile(workspaceSlug)
  → calls StaffService.getMyStaffProfile on mount
  → state: { data: IMyStaffProfile | null, isLoading, error }
  → 404 → data = null (not error)
```

## Related Code Files

### Files to modify
1. `apps/web/ce/services/staff.service.ts` — add `getMyStaffProfile()` method

### Files to create
1. `apps/web/ce/hooks/use-my-staff-profile.ts` — React hook

## Implementation Steps

1. **Add response type** in `apps/web/ce/services/staff.service.ts`:
   ```typescript
   export interface IMyStaffProfile {
     id: string;
     staff_id: string;
     position: string;
     department: string | null;
     department_detail: {
       id: string;
       name: string;
       code: string;
     } | null;
   }
   // employment_status excluded per validation Session 1
   ```

2. **Add service method** in `StaffService` class:
   ```typescript
   async getMyStaffProfile(workspaceSlug: string): Promise<IMyStaffProfile> {
     return this.get(`/api/workspaces/${workspaceSlug}/me/staff-profile/`)
       .then((response) => response?.data)
       .catch((error) => {
         throw error?.response?.data;
       });
   }
   ```

3. **Create hook** at `apps/web/ce/hooks/use-my-staff-profile.ts`:
   ```typescript
   import { useEffect, useState } from "react";
   import { StaffService, type IMyStaffProfile } from "@/plane-web/services/staff.service";

   const staffService = new StaffService();

   export const useMyStaffProfile = (workspaceSlug: string | undefined) => {
     const [data, setData] = useState<IMyStaffProfile | null>(null);
     const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
       if (!workspaceSlug) return;
       setIsLoading(true);
       staffService
         .getMyStaffProfile(workspaceSlug)
         .then(setData)
         .catch(() => setData(null))  // 404 = no profile, not an error
         .finally(() => setIsLoading(false));
     }, [workspaceSlug]);

     return { data, isLoading };
   };
   ```

## Todo List

- [ ] Add `IMyStaffProfile` interface to staff.service.ts
- [ ] Add `getMyStaffProfile()` method to StaffService class
- [ ] Create `use-my-staff-profile.ts` hook in `apps/web/ce/hooks/`
- [ ] Verify hook returns data for user with staff profile
- [ ] Verify hook returns null for user without staff profile

## Success Criteria

- Service method calls correct endpoint
- Hook returns staff data when profile exists
- Hook returns null (not error) when no profile (404)
- Loading state works correctly
- No unnecessary re-renders (stable deps in useEffect)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| workspaceSlug undefined on profile page | Medium | Hook guards with `if (!workspaceSlug) return` |
| Multiple mounts cause duplicate requests | Low | Could add SWR/abort later; acceptable for v1 |

## Security Considerations

- Service only calls own profile endpoint (server enforces `user=request.user`)
- No sensitive data stored client-side beyond what's displayed

## Next Steps

- Phase 3: Profile UI component consuming this hook
