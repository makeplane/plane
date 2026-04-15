# Job Positions Admin Frontend — Implementation Report

## Status: DONE

## Files Created

| File                                                                                    | Lines | Notes                                                |
| --------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------- |
| `apps/admin/store/instance-job-position.store.ts`                                       | 128   | MobX store mirroring task-category pattern           |
| `apps/admin/hooks/store/use-instance-job-position.tsx`                                  | 16    | Context hook                                         |
| `apps/admin/app/(all)/(dashboard)/job-positions/page.tsx`                               | 108   | Main page with split-pane layout                     |
| `apps/admin/app/(all)/(dashboard)/job-positions/components/job-position-list.tsx`       | 113   | Table with select/edit/delete + confirm dialog       |
| `apps/admin/app/(all)/(dashboard)/job-positions/components/job-grade-list.tsx`          | 115   | Grades panel — empty state when no position selected |
| `apps/admin/app/(all)/(dashboard)/job-positions/components/job-position-form-modal.tsx` | 100   | Create/edit modal via react-hook-form                |
| `apps/admin/app/(all)/(dashboard)/job-positions/components/job-grade-form-modal.tsx`    | 107   | Create/edit modal with position selector             |

## Files Modified

| File                                              | Change                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/admin/hooks/store/index.ts`                 | Added `export * from "./use-instance-job-position"`                  |
| `apps/admin/store/root.store.ts`                  | Added import, property, constructor init, and resetOnSignOut init    |
| `apps/admin/hooks/use-sidebar-menu/core.ts`       | Added `Briefcase` import, `"job-positions"` key + menu entry         |
| `apps/admin/app/(all)/(dashboard)/staff/page.tsx` | Added `Briefcase` import + Job Position link button before Add Staff |

## Architecture Notes

- Store follows exact MobX pattern from `instance-task-category.store.ts`: `observable`, `computed`, `action`, `runInAction` with `set` from lodash-es
- `fetchAll` uses `Promise.all` for parallel position+grade fetch
- Hook reads from `StoreContext` — same provider as all other stores
- Sidebar key `"job-positions"` added to `TCoreSidebarMenuKey` union type
- Page uses `useSWR("INSTANCE_JOB_POSITIONS", fetchAll)` — deduped fetch
- Grade list shows empty-state prompt when no position selected (split-pane UX matches task-categories)
- All delete operations guarded by confirm dialog with loading state
- All form modals reset correctly on open via `useEffect` watching `edit*` prop

## Unresolved Questions

- None. `JobPositionService` types (`IJobPosition`, `IJobGrade`, `IJobPositionCreate`, etc.) assumed already exported from `@plane/types` and `@plane/services` as stated in the brief.
