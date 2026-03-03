# Admin Workspace Management Pattern Exploration

**Date:** 2026-03-01 | **Scope:** Backend API + Admin Frontend architecture

## Backend API Structure (Django)

### Models

- **Location:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/models/instance.py`
- **Key Models:**
  - `Instance` — instance config (instance_name, instance_id, domain, telemetry flags)
  - `InstanceAdmin(BaseModel)` — admin assignment linking User to Instance with role (unique together: instance + user)
  - `InstanceConfiguration` — key-value store for instance settings (encrypted support)
  - `ChangeLog` — version tracking

### Admin API Views

- **Location:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/admin.py`
- **Classes:**
  - `InstanceAdminEndpoint(BaseAPIView)` — POST create admin, GET list admins, DELETE by pk
  - `InstanceAdminSignUpEndpoint(View)` — initial setup flow, validates email, creates User + InstanceAdmin
  - `InstanceAdminSignInEndpoint(View)` — session-based auth, checks InstanceAdmin.exists()
  - `InstanceAdminUserMeEndpoint(BaseAPIView)` — GET current admin session
  - `InstanceAdminSignOutEndpoint(View)` — logout, sets last_logout_time/ip

### Workspace Admin API Views

- **Location:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/workspace.py`
- **Classes:**
  - `InstanceWorkSpaceAvailabilityCheckEndpoint(BaseAPIView)` — GET check slug availability
  - `InstanceWorkSpaceEndpoint(BaseAPIView)` — GET list (with pagination, search by name), POST create workspace with owner validation

### URL Routes

- **Location:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/urls.py`
- **Pattern:**
  ```
  /api/instances/admins/              → POST/GET (create/list)
  /api/instances/admins/<pk>/         → DELETE
  /api/instances/admins/me/            → GET current user
  /api/instances/admins/session/       → GET session check
  /api/instances/admins/sign-in/       → POST auth
  /api/instances/admins/sign-up/       → POST initial setup
  /api/instances/workspace-slug-check/ → GET check slug
  /api/instances/workspaces/           → GET list (paginated), POST create
  ```

### Serializers

- **Location:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/serializers/admin.py`
- **Classes:**
  - `InstanceAdminMeSerializer(BaseSerializer)` — User fields (id, email, avatar, timezone, etc.)
  - `InstanceAdminSerializer(BaseSerializer)` — InstanceAdmin with `user_detail` nested (UserAdminLiteSerializer)

### Permissions

- **Class:** `InstanceAdminPermission` — requires authenticated InstanceAdmin
- **Bypass:** `AllowAny` on sign-up/sign-in/session-check endpoints

---

## Frontend Admin App Structure (React + Next.js)

### Store Pattern

- **Location:** `/Volumes/Data/SHBVN/plane.so/apps/admin/store/`
- **Key Stores:**
  - `WorkspaceStore(IWorkspaceStore)` — manages workspace list with pagination
    - **Observables:** `workspaces: Record<string, IWorkspace>`, `loader: TLoader`, `paginationInfo`
    - **Actions:** `fetchWorkspaces()`, `fetchNextWorkspaces()`, `createWorkspace()`
    - **Service:** `InstanceWorkspaceService` (from @plane/services)
  - `InstanceStore(IInstanceStore)` — manages instance config, admins, configurations
    - **Observables:** `instance`, `instanceAdmins`, `instanceConfigurations`, `formattedConfig`
    - **Actions:** `fetchInstanceInfo()`, `fetchInstanceAdmins()`, `fetchInstanceConfigurations()`, `updateInstanceConfigurations()`
  - `UserStore(IUserStore)` — current authenticated user
    - **Action:** `fetchCurrentUser()` triggers `store.instance.fetchInstanceAdmins()`

### API Service

- **Location:** `/Volumes/Data/SHBVN/plane.so/packages/services/src/workspace/instance-workspace.service.ts`
- **Class:** `InstanceWorkspaceService extends APIService`
- **Methods:**
  - `list(nextPageCursor?: string): Promise<TWorkspacePaginationInfo>` → `/api/instances/workspaces/`
  - `slugCheck(slug: string): Promise<any>` → `/api/instances/workspace-slug-check/`
  - `create(data: Partial<IWorkspace>): Promise<IWorkspace>` → `/api/instances/workspaces/`

### Pages & Routing

- **Location:** `/Volumes/Data/SHBVN/plane.so/apps/admin/app/`
- **Routes (from routes.ts):**
  ```
  /workspace           → workspace/page.tsx (list workspaces)
  /workspace/create    → workspace/create/page.tsx (create form)
  /general             → general/page.tsx (instance settings + admin list)
  /authentication/*    → auth config pages
  /email               → email config
  /ai                  → AI config
  /image               → image config
  ```

### Components

- **Workspace Management:**
  - `WorkspaceListItem` — displays workspace card (name, slug, owner email, project count, member count)
  - `WorkspaceManagementPage` — list view with pagination, toggle "disable workspace creation" flag
  - `WorkspaceCreateForm` (form.tsx) — form validation (name, slug, organization_size), slug availability check, create action

- **General Settings:**
  - `GeneralConfigurationForm` — displays instance details (name, admin email—read-only, instance ID)
  - Shows `instanceAdmins[0]?.user_detail?.email` (primary admin)

### Component Libraries & Patterns

- **UI Framework:** @plane/propel (Button, Input, ToggleSwitch, Dialog)
- **State:** MobX with `observer()` wrapper
- **Forms:** react-hook-form with Controller
- **Toast:** setToast / setPromiseToast from @plane/propel/toast
- **HTTP:** SWR for data fetching (useSWR hooks)

---

## Key Patterns for Plan B (User Management)

### 1. Admin CRUD Endpoint Pattern

```python
# backend
class AdminEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):  # List with filters/search
        items = Model.objects.filter(...)
        return self.paginate(request=request, queryset=items)

    def post(self, request):  # Create
        # validate, create, serialize, return 201
        pass

    def delete(self, request, pk):  # Delete by ID
        Model.objects.filter(pk=pk).delete()
        return Response(status=204)
```

### 2. MobX Store Pattern (Frontend)

```typescript
// Observable state + computed
workspaces: Record<string, IWorkspace> = {};
loader: TLoader = "init-loader";

// Fetch with loader states
fetchWorkspaces = async () => {
  this.loader = this.workspaceIds.length > 0 ? "mutation" : "init-loader";
  const data = await this.service.list();
  runInAction(() => {
    data.results.forEach(item => set(this.workspaces, [item.id], item));
    set(this, "paginationInfo", { ...data.paginationInfo });
  });
  this.loader = "loaded";
};
```

### 3. Pagination Pattern

```typescript
// Backend: cursor-based
/api/instances/workspaces/?cursor=<nextCursor>
// Returns: { results: [...], next_cursor, next_page_results, ... }

// Frontend: fetch on demand
fetchNextWorkspaces = async () => {
  if (!this.paginationInfo?.next_page_results) return;
  this.loader = "pagination";
  const data = await this.service.list(this.paginationInfo.next_cursor);
  // merge results...
};
```

### 4. Admin List Item Display Pattern

```tsx
// Shows owner email (read-only field from related User)
{
  workspace.owner.email;
}

// Uses nested serializer in backend:
// InstanceAdminSerializer: user_detail = UserAdminLiteSerializer(source="user")
```

### 5. Create Form Validation Pattern

```typescript
const handleCreate = async (formData) => {
  // 1. Check availability (slug check endpoint)
  await service.slugCheck(formData.slug);
  // 2. Create via service
  await createAction(formData);
  // 3. Toast feedback + redirect
  setToast({ type: SUCCESS, ... });
  router.push("/list");
};
```

### 6. Toggle Configuration Pattern

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);
const updateConfig = async (key, value) => {
  setIsSubmitting(true);
  const promise = updateInstanceConfigurations({ [key]: value });
  setPromiseToast(promise, { loading, success, error });
  await promise.finally(() => setIsSubmitting(false));
};

// Usage in form:
<ToggleSwitch
  value={Boolean(parseInt(configValue))}
  onChange={() => updateConfig("KEY", value ? "0" : "1")}
  disabled={isSubmitting}
/>;
```

---

## File Paths Summary

| Component             | Path                                                             |
| --------------------- | ---------------------------------------------------------------- |
| Backend Models        | `/apps/api/plane/license/models/instance.py`                     |
| Admin Views           | `/apps/api/plane/license/api/views/admin.py`                     |
| Workspace Views       | `/apps/api/plane/license/api/views/workspace.py`                 |
| Admin Serializers     | `/apps/api/plane/license/api/serializers/admin.py`               |
| URL Routes            | `/apps/api/plane/license/urls.py`                                |
| Workspace Service     | `/packages/services/src/workspace/instance-workspace.service.ts` |
| Workspace Store       | `/apps/admin/store/workspace.store.ts`                           |
| Instance Store        | `/apps/admin/store/instance.store.ts`                            |
| Workspace List Page   | `/apps/admin/app/(all)/(dashboard)/workspace/page.tsx`           |
| Workspace Create Page | `/apps/admin/app/(all)/(dashboard)/workspace/create/form.tsx`    |
| General Settings      | `/apps/admin/app/(all)/(dashboard)/general/form.tsx`             |
| App Routes            | `/apps/admin/app/routes.ts`                                      |

---

## Unresolved Questions

None at this stage — architecture is clear for Plan B implementation.
