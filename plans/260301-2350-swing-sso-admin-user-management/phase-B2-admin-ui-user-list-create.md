# Phase B2: Admin UI — User List & Create

## Context Links

- [Workspace list page (reference)](<../../apps/admin/app/(all)/(dashboard)/workspace/page.tsx>)
- [Workspace create form (reference)](<../../apps/admin/app/(all)/(dashboard)/workspace/create/>)
- [Workspace store (reference)](../../apps/admin/store/workspace.store.ts)
- [Admin routes](../../apps/admin/app/routes.ts)
- [Admin sidebar](../../apps/admin/components/)

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** Add user management pages in god-mode admin — paginated user list with search and create user form

## Key Insights

- Clone workspace management pattern: store + service + pages
- Admin app uses SWR for data fetching but stores manage state
- Sidebar navigation needs "Users" entry (find sidebar component)
- Form pattern: `react-hook-form` with `Controller` + propel inputs
- Pagination: cursor-based or offset-based, matching backend endpoint

## Requirements

**Functional:**

- `/users` page: paginated user list with search/filter
- User list item: display name, email, active status, workspace count
- `/users/create` page: form with first_name, last_name, email, password
- `/users/bulk-import` page: CSV upload → preview table → confirm → create users
- After create → toast + redirect to user detail or list
- Sidebar "Users" nav item between "Workspace" and "Authentication"

**Non-functional:**

- Components under 150 lines
- Use propel components (Button, Input, Dialog)
- Semantic color tokens
<!-- Updated: Validation Session 3 - Hardcode English, no i18n for admin app -->
- Hardcode English strings directly (admin app does not use i18n)

## Architecture

```
apps/admin/
├── store/
│   └── user.store.ts              # NEW: user management store
├── services/
│   └── instance-user.service.ts   # NEW: API service (or in packages/services/)
├── app/(all)/(dashboard)/
│   ├── users/
│   │   ├── page.tsx               # User list page
│   │   └── create/
│   │       └── page.tsx           # Create user page + form
├── components/
│   └── users/
│       ├── user-list-item.tsx     # List row component
│       └── user-create-form.tsx   # Create form component
└── app/routes.ts                  # Add routes
```

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/admin/store/user.store.ts`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/users/page.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/users/create/page.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/components/users/user-list-item.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/components/users/user-create-form.tsx`

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/routes.ts` — add user routes
- `/Volumes/Data/SHBVN/plane.so/apps/admin/store/root.store.ts` — register user store
- Admin sidebar component (find and add "Users" nav item)

**Files to reference:**

- `/Volumes/Data/SHBVN/plane.so/apps/admin/store/workspace.store.ts`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/workspace/page.tsx`

## Implementation Steps

### Step 1: Create API service

Option A — in admin app directly:

```typescript
// apps/admin/services/instance-user.service.ts
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@plane/services";

export class InstanceUserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(params?: { search?: string; page?: number; per_page?: number }): Promise<any> {
    return this.get("/api/instances/users/", { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async create(data: { first_name: string; last_name: string; email: string; password: string }): Promise<any> {
    return this.post("/api/instances/users/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async detail(userId: string): Promise<any> {
    return this.get(`/api/instances/users/${userId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async update(
    userId: string,
    data: Partial<{ first_name: string; last_name: string; is_active: boolean }>
  ): Promise<any> {
    return this.patch(`/api/instances/users/${userId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async addToWorkspace(userId: string, data: { workspace_id: string; role: number }): Promise<any> {
    return this.post(`/api/instances/users/${userId}/workspaces/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
```

### Step 2: Create MobX store (`user.store.ts`)

Clone `workspace.store.ts` pattern:

```typescript
// apps/admin/store/user.store.ts
import { makeObservable, observable, action, computed, runInAction } from "mobx";
import { set } from "mobx";
import { InstanceUserService } from "@/services/instance-user.service";

export interface IInstanceUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  workspaces?: any[];
}

type TLoader = "init-loader" | "mutation" | "pagination" | "loaded";

export interface IUserStore {
  users: Record<string, IInstanceUser>;
  loader: TLoader;
  totalCount: number;
  currentPage: number;
  searchQuery: string;
  // computed
  userList: IInstanceUser[];
  // actions
  fetchUsers: (search?: string, page?: number) => Promise<void>;
  createUser: (data: any) => Promise<IInstanceUser>;
  fetchUserDetail: (userId: string) => Promise<IInstanceUser>;
}

export class UserStore implements IUserStore {
  users: Record<string, IInstanceUser> = {};
  loader: TLoader = "init-loader";
  totalCount = 0;
  currentPage = 1;
  searchQuery = "";

  private service: InstanceUserService;

  constructor() {
    makeObservable(this, {
      users: observable,
      loader: observable,
      totalCount: observable,
      currentPage: observable,
      searchQuery: observable,
      userList: computed,
      fetchUsers: action,
      createUser: action,
      fetchUserDetail: action,
    });
    this.service = new InstanceUserService();
  }

  get userList(): IInstanceUser[] {
    return Object.values(this.users).sort(
      (a, b) => new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime()
    );
  }

  fetchUsers = async (search?: string, page = 1) => {
    this.loader = Object.keys(this.users).length > 0 ? "mutation" : "init-loader";
    this.searchQuery = search || "";
    try {
      const data = await this.service.list({ search, page, per_page: 20 });
      runInAction(() => {
        // Clear on fresh search
        if (page === 1) this.users = {};
        data.results.forEach((user: IInstanceUser) => {
          set(this.users, user.id, user);
        });
        this.totalCount = data.total_count;
        this.currentPage = page;
        this.loader = "loaded";
      });
    } catch {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  createUser = async (data: any): Promise<IInstanceUser> => {
    const user = await this.service.create(data);
    runInAction(() => {
      set(this.users, user.id, user);
      this.totalCount += 1;
    });
    return user;
  };

  fetchUserDetail = async (userId: string): Promise<IInstanceUser> => {
    const user = await this.service.detail(userId);
    runInAction(() => {
      set(this.users, user.id, user);
    });
    return user;
  };
}
```

### Step 3: Register store in root store

Find `apps/admin/store/root.store.ts` and add:

```typescript
import { UserStore, type IUserStore } from "./user.store";

// In RootStore class:
user: IUserStore;

constructor() {
  // ... existing ...
  this.user = new UserStore();
}
```

### Step 4: Add routes (`routes.ts`)

```typescript
route("users", "./(all)/(dashboard)/users/page.tsx"),
route("users/create", "./(all)/(dashboard)/users/create/page.tsx"),
```

### Step 5: Create user list page (`users/page.tsx`)

```typescript
// Key elements:
// - Search input (debounced)
// - "Create User" button → navigate to /users/create
// - Paginated list of UserListItem components
// - Loading state (Loader from @plane/ui)
// - Empty state when no users
```

### Step 6: Create user list item (`components/users/user-list-item.tsx`)

```typescript
// Display: avatar, display_name/email, is_active badge, date_joined
// Click → navigate to /users/{id} (Phase B3)
// Badge: "Active" (green) / "Deactivated" (red)
```

### Step 7: Create user form (`users/create/page.tsx` + `user-create-form.tsx`)

```typescript
// Form fields: first_name, last_name, email, password
// Email validation: required, valid format
// Password: min 8 chars, show/hide toggle
// Submit: createUser → toast success → navigate to /users or /users/{id}
// Cancel: navigate back to /users
// Uses react-hook-form + Controller pattern
```

### Step 8: Add sidebar navigation

Find the sidebar/navigation component in admin app. Add "Users" entry:

```typescript
{
  name: "Users",
  href: "/users",
  icon: UsersIcon, // from lucide-react
}
```

Place between "Workspace" and "Authentication" in nav order.

### ~~Step 9: Add i18n translations~~ (REMOVED — Validation Session 3)

Admin app hardcodes English strings. No translation keys needed.

## Todo List

- [ ] Create `instance-user.service.ts`
- [ ] Create `user.store.ts`
- [ ] Register store in `root.store.ts`
- [ ] Add routes to `routes.ts`
- [ ] Create `users/page.tsx` — list page
- [ ] Create `users/create/page.tsx` — create page
- [ ] Create `user-list-item.tsx` component
- [ ] Create `user-create-form.tsx` component
- [ ] Add "Users" to sidebar navigation
- [ ] ~~Add i18n translations~~ (REMOVED — hardcode English)
- [ ] Verify all components under 150 lines

## Success Criteria

- `/users` page shows paginated user list
- Search filters users by name/email
- `/users/create` form creates user via API
- Toast feedback on success/error
- Sidebar shows "Users" nav item
- Navigation between list/create works

## Risk Assessment

- **Pagination pattern**: verify backend returns format matching frontend expectations
- **Store registration**: admin root store may differ from web app pattern — inspect before implementing
- **Sidebar**: need to find exact component/file for navigation items

## Security Considerations

- Admin-only pages — protected by auth middleware
- Password field: min 8 chars, not displayed after creation
- Email uniqueness enforced by backend

## Next Steps

- Phase B3: User Detail & Workspace Assignment
