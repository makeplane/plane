# Phase 03 — Shared Service + Admin Types

**Priority:** P1 | **Status:** pending | **Depends:** 02

## Overview

Frontend data layer: a service class hitting the 2 endpoints + TS types mirroring the response contract exactly. Service methods are typed to their response (no `unknown`+cast).

## Key Insights

- Admin services live in `packages/services/src/instance/`, extend `APIService(API_BASE_URL)`, return `response.data`, throw `error.response.data`. `verified by packages/services/src/instance/monitoring.service.ts`
- `MonitoringService` returns `Promise<unknown>` — do NOT copy that. The contract is owned in-repo; type methods to `T*Response` so a backend drift is a compile error, not a silent empty chart.
- `packages/services/src/index.ts:14` does `export * from "./instance"` → add export in `instance/index.ts`.
- **Type location (user-confirmed 2026-06-01):** shared response types live in `packages/types`; UI-only types stay admin-local. `packages/services` cannot import `apps/admin`, so response types MUST be in `packages/types` for the service to be typed.

## Architecture

Create `packages/services/src/instance/usage-monitor.service.ts`:

```ts
export class UsageMonitorService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  async fetchUsers(params?: Record<string, string>): Promise<TUsageUsersResponse> {
    return this.get("/api/instances/usage-monitor/users/", { params })
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }
  async fetchDepartments(params?: Record<string, string>): Promise<TDepartmentsResponse> {
    return this.get("/api/instances/usage-monitor/departments/", { params })
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }
}
```

(Response types imported from `@plane/types` — they live in `packages/types/src` so service + store share one source. UI-only types like `TUsageMonitorTab` stay admin-local.)

Add `export * from "./usage-monitor.service";` to `packages/services/src/instance/index.ts`.

Response types in `packages/types/src/usage-monitor.ts` (export via `packages/types/src/index.ts`); UI-only `TUsageMonitorTab` in `apps/admin/store/usage-monitor.types.ts`:
**Response types → `packages/types/src/usage-monitor.ts`:**

- `TUsageUsersResponse = { series_active: {period:string; active_users:number}[]; series_standard: {period:string; standard_user_days:number; non_standard_user_days:number}[]; total_active_users:number; pie:{standard_users:number; non_standard_users:number; total_active_users:number} }`
- `TDepartmentRow = { workspace_id:string; workspace_name:string; slug:string; active_users:number; standard_users:number; total_logged_minutes:number; projects_with_logged_time:number }`
- `TProjectRow = { project_id:string; project_name:string; total_logged_minutes:number }`
- `TDepartmentsResponse = { workspaces: TDepartmentRow[]; projects?: TProjectRow[] }`

**UI-only types → `apps/admin/store/usage-monitor.types.ts`:**

- `TUsageGranularity = "day" | "month" | "year"`
- `TUsagePreset = "week" | "month" | "3-month" | "custom"`
- `TUsageFilters = { granularity: TUsageGranularity; preset: TUsagePreset; date_from: string; date_to: string; workspace_id?: string }` (date_from/date_to resolved client-side from preset, always sent)
- `TUsageMonitorTab = "active-users" | "standard-users" | "departments"`

**No `granularity/date_from/date_to` envelope fields in response types** — they are not returned by the endpoints (client owns filter state). Contract = types exactly.

## Related Code Files

- Create: `packages/services/src/instance/usage-monitor.service.ts`, `packages/types/src/usage-monitor.ts` (response types), `apps/admin/store/usage-monitor.types.ts` (UI-only `TUsageMonitorTab`)
- Modify: `packages/services/src/instance/index.ts`, `packages/types/src/index.ts` (`export * from "./usage-monitor"`)

## Implementation Steps

1. Confirm `instance/index.ts` export style; add new export line.
2. Write response types in `packages/types/src/usage-monitor.ts` (export from index) matching Phase-02 JSON exactly; `TUsageMonitorTab` stays admin-local.
3. Write service typed to `T*Response` (no `unknown`).
4. `pnpm --filter @plane/services build` or `tsc --noEmit` to verify.

## Todo

- [ ] usage-monitor.service.ts (typed returns, 2 methods)
- [ ] export from instance/index.ts
- [ ] response types in packages/types (exported); TUsageMonitorTab admin-local
- [ ] type-check passes

## Success Criteria

Service importable as `import { UsageMonitorService } from "@plane/services"`; methods return `T*Response` (no `unknown`/`any`); types compile and match Phase-02 JSON field-for-field.

## Next

Phase 04 wraps the service in a MobX store.
