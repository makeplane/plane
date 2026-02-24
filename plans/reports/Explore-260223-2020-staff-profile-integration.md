# Exploration Report: User Profile Page & Staff Management Integration

**Date:** 2026-02-23
**Scope:** Profile settings UI, StaffProfile model, API endpoints, and available staff data

---

## 1. Plan Overview Summary (260217-1300)

**Status:** Completed & Validated (TS fixes applied 2026-02-18)

**What Was Built:**

### Backend (Django APIs)
- **StaffProfile Model** — Employee record with staff_id, department FK, position, job_grade, phone, employment_status
- **Department Model** — Multi-level hierarchy (L1-L5), linked to Project, manager FK
- **APIs** — CRUD + tree + transfer + deactivate + bulk import/export + stats
- **Auto-membership Logic** — Staff auto-join linked projects; managers auto-join children projects

### Frontend (React/Workspace Settings)
- **Department Management UI** — Tree view, CRUD modal, link project selector
- **Staff Management UI** — Table with pagination, CRUD modal, CSV import/export, transfer dialog
- **Services** — `staff.service.ts`, `department.service.ts` in `apps/web/ce/services/`

---

## 2. Current User Profile Page Architecture

### File Paths
- **Profile Store:** `/Volumes/Data/SHBVN/plane.so/apps/web/core/store/user/profile.store.ts`
- **Profile Form:** `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/settings/profile/content/pages/general/form.tsx`
- **Profile Root:** `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/settings/profile/content/pages/general/root.tsx`
- **Sidebar:** `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/settings/profile/sidebar/`
- **Content Root:** `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/settings/profile/content/root.tsx`

### Current Form Fields (GeneralProfileSettingsForm)

```typescript
type TUserProfileForm = {
  avatar_url: string;
  cover_image: string;
  cover_image_asset: any;
  cover_image_url: string;
  first_name: string;           // ← Already present
  last_name: string;            // ← Already present
  display_name: string;         // ← Already present
  email: string;                // ← Already present (disabled)
  role: string;                 // ← Profile role (e.g., "Product / Project Manager")
  language: string;             // ← Profile language
  user_timezone: string;        // ← User timezone
};
```

**Current form displays:**
- Avatar + cover image upload
- First name, last name, display name
- Email (read-only)
- Role (free text field)
- No staff-related fields yet

---

## 3. StaffProfile Model Fields

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/staff.py`

```python
class StaffProfile(BaseModel):
    workspace = ForeignKey(Workspace, ...)              # Workspace scoped
    user = ForeignKey(User, ...)                        # 1:1 with User
    
    # Staff ID
    staff_id = CharField(max_length=8, db_index=True)   # "18506320"
    
    # Department
    department = ForeignKey(Department, null=True, blank=True)
    
    # Job info
    position = CharField(max_length=255, blank=True)    # "Senior Developer"
    job_grade = CharField(max_length=50, blank=True)    # "Senior"
    
    # Contact
    phone = CharField(max_length=20, blank=True)        # "0901234567"
    
    # Dates
    date_of_joining = DateField(null=True, blank=True)
    date_of_leaving = DateField(null=True, blank=True)
    
    # Status
    employment_status = CharField(                       # "active" | "probation" | "resigned" | ...
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE
    )
    
    # Special permissions
    is_department_manager = BooleanField(default=False) # Auto-join children projects
    
    notes = TextField(blank=True)
    
    @property
    def email(self):
        return f"sh{self.staff_id}@swing.shinhan.com"   # Generated email
```

**Key Unique Constraints:**
- `(workspace, staff_id)` — unique per workspace
- `(workspace, user)` — one staff profile per workspace per user

---

## 4. Frontend Staff Service API

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/ce/services/staff.service.ts`

### IStaff TypeScript Interface
```typescript
interface IStaff {
  id: string;
  workspace: string;
  user: string;
  staff_id: string;
  department: string | null;
  department_detail: {
    id: string;
    name: string;
    code: string;
  } | null;
  user_detail: {
    id: string;
    display_name: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  email: string;
  display_name: string;
  position: string;              // ← KEY
  job_grade: string;             // ← KEY
  phone: string;
  date_of_joining: string | null;
  date_of_leaving: string | null;
  employment_status: "active" | "probation" | "resigned" | "suspended" | "transferred";
  is_department_manager: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}
```

### Available Methods
- `getStaffList(workspaceSlug, params?)` — GET `/api/workspaces/{slug}/staff/`
- `getStaff(workspaceSlug, staffId)` — GET `/api/workspaces/{slug}/staff/{id}/`
- `createStaff(workspaceSlug, data)` — POST
- `updateStaff(workspaceSlug, staffId, data)` — PATCH
- `deleteStaff(workspaceSlug, staffId)` — DELETE
- `transferStaff(workspaceSlug, staffId, departmentId)` — POST transfer/
- `deactivateStaff(workspaceSlug, staffId)` — POST deactivate/
- `bulkImport(workspaceSlug, formData)` — POST bulk-import/
- `exportStaff(workspaceSlug)` — GET export/ (CSV blob)
- `getStats(workspaceSlug)` — GET stats/

---

## 5. Backend Staff/Department API Endpoints

**Staff Endpoints:**
- `GET /api/workspaces/<slug>/staff/` — List all staff (admin only)
- `GET /api/workspaces/<slug>/staff/<id>/` — Get single staff
- `POST /api/workspaces/<slug>/staff/` — Create (auto-creates User + WorkspaceMember)
- `PATCH /api/workspaces/<slug>/staff/<id>/` — Update
- `DELETE /api/workspaces/<slug>/staff/<id>/` — Soft delete
- `POST /api/workspaces/<slug>/staff/<id>/transfer/` — Transfer department
- `POST /api/workspaces/<slug>/staff/<id>/deactivate/` — Deactivate

**Department Endpoints:**
- `GET /api/workspaces/<slug>/departments/` — List (flat)
- `GET /api/workspaces/<slug>/departments/tree/` — List (nested tree)
- `GET /api/workspaces/<slug>/departments/<id>/` — Get detail
- `POST /api/workspaces/<slug>/departments/` — Create
- `PATCH /api/workspaces/<slug>/departments/<id>/` — Update
- `DELETE /api/workspaces/<slug>/departments/<id>/` — Soft delete
- `POST /api/workspaces/<slug>/departments/<id>/link-project/` — Link to project + auto-sync members
- `DELETE /api/workspaces/<slug>/departments/<id>/unlink-project/` — Unlink

---

## 6. User Profile Data Access Pattern

### Current Flow (Profile Store)
```
ProfileStore (core/store/user/profile.store.ts)
├─ fetchUserProfile() → UserService.getCurrentUserProfile()
├─ data: TUserProfile (contains: id, user, role, theme, language, etc.)
└─ updateUserProfile(data) → UserService.updateCurrentUserProfile()
```

**Current TUserProfile fields:**
```typescript
type TUserProfile = {
  id: string;
  user: IUser;
  role: string;                    // Job title (free text, not linked to staff)
  last_workspace_id: string;
  theme: IUserTheme;
  onboarding_step: {...};
  is_onboarded: boolean;
  is_tour_completed: boolean;
  language: string;
  start_of_the_week: EStartOfTheWeek;
  billing_address_country: string;
  billing_address: string;
  has_billing_address: boolean;
  has_marketing_email_consent: boolean;
  created_at: string;
  updated_at: string;
}
```

**No staff profile data included yet** — profile.role is just a text field, not linked to StaffProfile.position

### Potential Enhancement Path
Option 1: Extend TUserProfile to include staff_profile data (if exists)
Option 2: Create separate useStaffProfile hook that fetches IStaff data
Option 3: Enrich UserProfile API response to include staff profile inline

---

## 7. Key Observations

### What's Already Built
✅ StaffProfile model with all necessary fields (staff_id, position, job_grade, phone, department, employment_status)
✅ Staff API endpoints (CRUD + transfer + deactivate + import/export)
✅ Staff service client in frontend with full methods
✅ Department API endpoints + tree view
✅ Auto-membership logic (signals trigger ProjectMember sync)

### What's NOT Connected Yet
❌ User profile form doesn't display staff data (position, job_grade, department, phone, etc.)
❌ Profile.role is free text, not linked to StaffProfile.position
❌ No display of department on profile page
❌ No integration of staff data into ProfileStore

### Form Fields Missing from Profile Page
- **position** (from StaffProfile) — Current form has free-text "role" but not linked to staff
- **job_grade** (from StaffProfile)
- **department** (from StaffProfile)
- **phone** (from StaffProfile)
- **staff_id** (from StaffProfile)
- **employment_status** (from StaffProfile) — could show as badge
- **date_of_joining** (from StaffProfile)

---

## 8. Service Integration Points

### Services Available
1. **ProfileStore** — Manages TUserProfile (themes, onboarding, settings)
2. **UserService** — Fetches/updates user profile
3. **StaffService** — CRUD staff, import/export, transfer, deactivate
4. **DepartmentService** — CRUD departments, tree view

### Gap: No "get current user's staff profile" endpoint
**Need:** API endpoint to fetch staff profile for current user without admin permission
- Current: `GET /api/workspaces/<slug>/staff/` requires admin
- Needed: `GET /api/workspaces/<slug>/staff/me/` or enhance user profile endpoint

---

## File Structure Summary

### Backend
```
apps/api/plane/
├─ db/models/
│  ├─ staff.py               (StaffProfile model)
│  └─ department.py          (Department model)
├─ app/views/workspace/
│  ├─ staff.py              (StaffViewSet + endpoints)
│  └─ department.py         (DepartmentViewSet + endpoints)
├─ app/serializers/
│  ├─ staff.py              (StaffProfileSerializer)
│  └─ department.py         (DepartmentSerializer)
└─ app/urls/workspace/
   ├─ staff.py              (URL routing)
   └─ department.py         (URL routing)
```

### Frontend
```
apps/web/
├─ core/store/user/
│  └─ profile.store.ts      (ProfileStore - no staff data yet)
├─ core/services/
│  └─ [user.service.ts for profile endpoints]
├─ ce/services/
│  ├─ staff.service.ts      (StaffService - full CRUD)
│  └─ department.service.ts (DepartmentService)
├─ core/components/settings/profile/
│  ├─ content/pages/general/
│  │  ├─ form.tsx          (GeneralProfileSettingsForm - needs staff fields)
│  │  └─ root.tsx          (Wrapper component)
│  ├─ content/root.tsx
│  └─ sidebar/
└─ [Staff/Department pages in settings/]
```

---

## 9. Unresolved Questions

1. **Should profile.role be replaced or enhanced?**
   - Current: Free-text "role" field (Product Manager, etc.)
   - Option A: Keep both (role for job title, position for formal designation)
   - Option B: Map profile.role → StaffProfile.position
   - Option C: Remove role, use position only

2. **Should ProfileStore include staff data?**
   - Option A: Extend TUserProfile to include optional staff_profile: IStaff
   - Option B: Keep separate, add useStaffProfile hook
   - Option C: Add staff_profile inline in user profile API response

3. **Read-only or editable on profile page?**
   - Staff data is admin-only to manage (Workspace Settings)
   - Should profile page show as read-only info display?
   - Or allow user to update own phone/notes?

4. **Department display level?**
   - Show only assigned department (immediate)
   - Show full hierarchy path (RBG → RBG-CR → RBG-CR-AP)?
   - Show manager name?

5. **Permission: How do non-admin users fetch their own staff profile?**
   - Current API requires admin role
   - Need public endpoint for current user's staff data

---

## Summary Table

| Component | Location | Current Status | Staff-Related Fields |
|-----------|----------|-----------------|----------------------|
| Model | `apps/api/plane/db/models/staff.py` | ✅ Complete | staff_id, department, position, job_grade, phone, employment_status, date_of_joining |
| API Serializer | `apps/api/plane/app/serializers/staff.py` | ✅ Complete | Full IStaff interface |
| API Endpoints | `apps/api/plane/app/views/workspace/staff.py` | ✅ Complete | CRUD, transfer, deactivate, import, export, stats |
| Frontend Service | `apps/web/ce/services/staff.service.ts` | ✅ Complete | All methods available |
| Profile Store | `apps/web/core/store/user/profile.store.ts` | ⚠️ Partial | No staff data included |
| Profile Form | `apps/web/.../profile/.../general/form.tsx` | ⚠️ Partial | Missing staff fields (position, job_grade, department, phone, etc.) |
| Profile Page | `apps/web/.../profile/.../general/root.tsx` | ⚠️ Partial | Doesn't fetch/display staff data |

