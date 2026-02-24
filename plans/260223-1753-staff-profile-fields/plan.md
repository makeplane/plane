---
title: "Staff Profile Fields on User Profile"
description: "Add read-only Staff ID, Department, Title fields to profile page"
status: complete
priority: P2
effort: 3h
branch: develop
tags: [profile, staff, ui, backend]
created: 2026-02-23
---

# Staff Profile Fields on User Profile

## Summary

Add read-only staff info (Staff ID, Department, Title/Position) to the User Profile general settings page. Requires a new lightweight backend endpoint for current user's own staff profile, frontend service method, and a UI section that hides gracefully when no StaffProfile exists.

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Backend — `GET /api/workspaces/{slug}/me/staff-profile/` | pending | 1h | [phase-01](./phase-01-backend-my-staff-endpoint.md) |
| 2 | Frontend service + hook | pending | 0.5h | [phase-02](./phase-02-frontend-service-and-store.md) |
| 3 | Profile UI — read-only staff section | pending | 1.5h | [phase-03](./phase-03-profile-ui-staff-section.md) |

## Dependencies

- StaffProfile model exists (`apps/api/plane/db/models/staff.py`)
- Department model exists (`apps/api/plane/db/models/department.py`)
- Staff admin API exists at `workspaces/<slug>/staff/` (admin-only)
- Existing profile form: `apps/web/core/components/settings/profile/content/pages/general/form.tsx`

## Key Decisions

- New endpoint scoped to `me/` — no admin required, only returns own profile
- Profile UI is workspace-scoped (needs `workspaceSlug` from current workspace context)
- Hide staff section entirely if user has no StaffProfile (404 → hidden)
- Read-only display — no editing from profile page (admin manages via Staff settings)

## Architecture

```
Browser → GET /api/workspaces/{slug}/me/staff-profile/
       → MyStaffProfileEndpoint (IsAuthenticated + workspace member)
       → StaffProfile.objects.get(workspace__slug=slug, user=request.user)
       → Return {staff_id, position, department_name, department_id}

Profile UI → useMyStaffProfile(workspaceSlug) hook
           → StaffService.getMyStaffProfile()
           → Render read-only fields or hide section
```

## Validation Log

### Session 1 — 2026-02-23
**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** The profile page URL is `/profile/` (not workspace-scoped), but staff data is workspace-scoped. The plan uses `useWorkspace().currentWorkspace?.slug` to get the workspace. If a user belongs to multiple workspaces with different StaffProfiles, they'll only see the "current" workspace's profile. Is this acceptable?
   - Options: Yes, show current workspace only (Recommended) | Show all workspaces' staff profiles | Add workspace selector to section
   - **Answer:** Current workspace only (confirmed via file reference)
   - **Custom input:** "Profile của user là file này /Volumes/Data/SHBVN/plane.so/apps/web/core/components/settings/profile/content/pages/general/form.tsx"
   - **Rationale:** Profile page already uses current workspace context. Single workspace display is consistent with existing patterns.

2. **[Architecture]** The plan puts the StaffProfileSection inside the core `form.tsx` file (which is in `core/`). Since this is CE-specific, should the import go directly in form.tsx or use a CE wrapper?
   - Options: Direct import in form.tsx (Recommended) | CE override of entire form.tsx | Slot/render-prop pattern in core
   - **Answer:** Direct import in form.tsx
   - **Rationale:** Simplest approach. Component lives in `ce/` but import in core is acceptable for a single section insertion.

3. **[Scope]** The plan shows 3 fields: Staff ID, Department, Position. Should Employment Status also be displayed? The serializer includes it.
   - Options: Show all 4 fields including status (Recommended) | Only 3 fields (no status)
   - **Answer:** Only 3 fields (no status)
   - **Rationale:** Keeps display minimal. Employment status can be added later if needed. Serializer should still exclude it from response.

4. **[Architecture]** For the backend endpoint, should it use the existing `StaffProfileSerializer` or create a new lightweight `MyStaffProfileSerializer`?
   - Options: New lightweight serializer (Recommended) | Reuse existing StaffProfileSerializer
   - **Answer:** New lightweight serializer
   - **Rationale:** Explicit API surface — only expose staff_id, position, department_detail. No sensitive fields (notes, phone) leak.

#### Confirmed Decisions
- Workspace scope: current workspace only — consistent with profile page pattern
- Integration: direct import in core form.tsx — simple, component in ce/
- Fields: 3 fields only (Staff ID, Department, Position) — no Employment Status
- Serializer: new lightweight MyStaffProfileSerializer — minimal exposure

#### Action Items
- [ ] Remove `employment_status` from MyStaffProfileSerializer fields
- [ ] Remove `employment_status` from IMyStaffProfile TypeScript interface
- [ ] Remove Employment Status from UI display (already not in Phase 3 mockup)

#### Impact on Phases
- Phase 1: Remove `employment_status` from serializer fields list
- Phase 2: Remove `employment_status` from `IMyStaffProfile` interface

### Session 2 — 2026-02-23
**Trigger:** Pre-implementation validation of remaining design decisions
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** The hook creates a new `StaffService()` instance at module scope. Should we reuse an existing singleton or is a new instance acceptable?
   - Options: New instance is fine | Reuse existing singleton
   - **Answer:** New instance is fine
   - **Rationale:** Simple, isolated — no coupling to other code. Consistent with other hook patterns in codebase.

2. **[Scope]** The plan places `StaffProfileSection` after the form fields grid but BEFORE the save button (inside the form). Since staff fields are read-only, they don't submit with the form. Correct placement?
   - Options: Inside form, before save (Recommended) | After entire form block | Before the form
   - **Answer:** Inside form, before save
   - **Rationale:** Visual continuity — staff info appears as part of profile page flow. Read-only inputs won't interfere with form submission.

3. **[Architecture]** The `useMyStaffProfile` hook refetches on every mount (no caching). Acceptable for v1?
   - Options: No caching, refetch on mount (Recommended) | Add SWR/useSWR for caching
   - **Answer:** No caching, refetch on mount
   - **Rationale:** Simple, data is fresh. Endpoint is lightweight. Can add caching later if needed.

#### Confirmed Decisions
- Service instantiation: new instance at module scope — simple, isolated
- UI placement: inside form, before save button — visual continuity
- Caching: none for v1 — refetch on mount, endpoint is lightweight

#### Action Items
- None — all answers confirm existing plan design

#### Impact on Phases
- No changes required — plan is validated as-is
