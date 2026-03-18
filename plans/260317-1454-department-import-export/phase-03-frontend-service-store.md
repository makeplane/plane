# Phase 03 — Frontend Service + Store

**Plan:** [plan.md](./plan.md) | **Prev:** [phase-02-backend-bulk-import.md](./phase-02-backend-bulk-import.md) | **Next:** [phase-04-frontend-ui.md](./phase-04-frontend-ui.md)

## Overview

| Field | Value |
|---|---|
| Date | 2026-03-17 |
| Description | Add `exportDepartments()` and `bulkImport()` to service + store |
| Priority | P2 |
| Status | ⬜ pending |

## Requirements

<!-- Updated: Validation Session 1 - window.open() for export, no blob/service method needed -->
- Service: **one new method** on `InstanceDepartmentService`
  - `bulkImport(data: IDepartmentBulkImportRequest): Promise<IDepartmentBulkImportResponse>`
  - Export uses `window.open()` directly — no service method needed
- Store: two new actions on `InstanceDepartmentStore`
  - `exportDepartments(): void` — `window.open('/api/instances/departments/export/')` (synchronous)
  - `bulkImport(data): Promise<IDepartmentBulkImportResponse>`
- New types: `IDepartmentBulkImportRequest`, `IDepartmentBulkImportResponse`, `IDepartmentBulkImportRow`

## Related Code Files

- `packages/services/src/department/instance-department.service.ts` — add methods + types
- `apps/admin/store/instance-department.store.ts` — add store actions + interface updates

## Implementation Steps

### Service (`instance-department.service.ts`)

1. Add types at top of file:
   ```typescript
   export interface IDepartmentBulkImportRow {
     name: string;
     code?: string;
     short_name: string;
     dept_code: string;
     dept_type?: "HO" | "BRX" | "OSR" | "";
     parent_code?: string;
     manager_email?: string;
     sort_order?: number;
     is_active?: boolean;
   }

   export interface IDepartmentBulkImportRequest {
     departments: IDepartmentBulkImportRow[];
   }

   export interface IDepartmentBulkImportSkipped {
     row_number: number;
     name: string;
     reason: string;
   }

   export interface IDepartmentBulkImportResponse {
     created: IInstanceDepartment[];
     skipped: IDepartmentBulkImportSkipped[];
     total_created: number;
     total_skipped: number;
   }
   ```

2. Add `exportDepartments(format = "xlsx"): Promise<Blob>`:
   ```typescript
   // Use axios responseType: "blob" for binary download
   return this.get("/api/instances/departments/export/", {
     params: { format },
     responseType: "blob",
   }).then((res) => res?.data as Blob)
   ```

3. Add `bulkImport(data: IDepartmentBulkImportRequest): Promise<IDepartmentBulkImportResponse>`:
   ```typescript
   return this.post("/api/instances/departments/bulk-import/", data)
     .then((res) => res?.data as IDepartmentBulkImportResponse)
   ```

### Store (`instance-department.store.ts`)

1. Update `IInstanceDepartmentStore` interface: add `exportDepartments` and `bulkImport` signatures
2. Add to `makeObservable`: register both as `action`
3. Implement `exportDepartments`:
   - Call `this.service.exportDepartments(format)`
   - Create object URL from Blob → trigger `<a>` download → revoke URL
4. Implement `bulkImport`:
   - Call `this.service.bulkImport(data)`
   - On success, call `fetchTree()` to refresh UI
   - Return response for UI to display results

## Todo

- [ ] Add 4 new types to `instance-department.service.ts`
- [ ] Add `exportDepartments()` method to service
- [ ] Add `bulkImport()` method to service
- [ ] Update store interface with new signatures
- [ ] Add `exportDepartments` action to store (with download trigger)
- [ ] Add `bulkImport` action to store (with tree refresh)
- [ ] Run `pnpm check:lint` — 0 errors

## Success Criteria

- TypeScript compiles without errors
- `exportDepartments` triggers browser file download
- `bulkImport` returns typed response
- Store `bulkImport` refreshes tree after successful import
- No lint errors

## Risk Assessment

- `axios` blob response: confirm `APIService` base class supports `responseType: "blob"` option
- If not, alternative: use `fetch` directly for export, or add `getBlob()` helper to base service
