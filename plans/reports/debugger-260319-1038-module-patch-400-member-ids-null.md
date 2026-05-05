---
title: "Module PATCH 400 — member_ids: null after permission revoke+re-grant"
slug: module-patch-400-member-ids-null
created: 2026-03-19
---

# Module PATCH 400 — member_ids: null after permission revoke+re-grant

## Executive Summary

**Issue:** PATCH to update a module returns 400 Bad Request when the current user's admin
role has been revoked and then re-granted within the same session. Payload contains
`"member_ids": null`, which the backend serializer rejects. The frontend's MobX store
serves stale `null` for `member_ids`, causing the edit form to submit an invalid value.

**Root cause:** Two layered bugs — one backend serializer gap and one frontend race condition
— conspire to store `null` for `member_ids` in MobX, which is then submitted verbatim.

---

## Root Cause Analysis

### Bug 1 — Workspace modules endpoint serializes `member_ids` as `null`

**File:** `apps/api/plane/app/views/workspace/module.py`

`WorkspaceModulesEndpoint.get()` uses `ModuleSerializer(modules, many=True)`.

`ModuleSerializer` (in `apps/api/plane/app/serializers/module.py` line 209) declares:

```python
member_ids = serializers.ListField(child=serializers.UUIDField(), required=False, allow_null=True)
```

The queryset in `WorkspaceModulesEndpoint` has **no `member_ids` annotation** — unlike
`ModuleViewSet.get_queryset()` which annotates `member_ids` via `ArrayAgg`.

DRF tries to access `instance.member_ids`. Since `Module` has no `member_ids` model field and no
annotation, DRF falls back to returning `None` (serializes as JSON `null`). Result: every module
returned from `GET /api/workspaces/{slug}/modules/` has `"member_ids": null`.

### Bug 2 — Frontend store race condition overwrites valid `member_ids` with `null`

**File:** `apps/web/core/layouts/auth-layout/project-wrapper.tsx` lines 129–135

The SWR key is `PROJECT_MODULES(projectId, currentProjectRole)`. When `currentProjectRole`
changes (after revoke + re-grant), SWR invalidates and re-runs:

```typescript
async () => {
  await Promise.all([fetchModulesSlim(workspaceSlug, projectId), fetchModules(workspaceSlug, projectId)]);
};
```

- `fetchModulesSlim` → calls `getWorkspaceModules(workspaceSlug)` (workspace endpoint) → returns `member_ids: null`
- `fetchModules` → calls project-specific endpoint → returns `member_ids: []` or `[uuid, ...]`

Both use `set(this.moduleMap, [module.id], { ...this.moduleMap[module.id], ...module })`.
Whichever resolves **last** overwrites `member_ids`. If `fetchModulesSlim` wins last,
`module_ids` in the store becomes `null`.

### Bug 3 — Form submits `member_ids: null` verbatim, serializer rejects it

**File:** `apps/web/core/components/modules/form.tsx` lines 76–81

```typescript
useEffect(() => {
  reset({ ...defaultValues, ...data });
}, [data, reset]);
```

`data.member_ids` is `null` (from store). Spread overwrites `defaultValues.member_ids = []`
→ form state becomes `member_ids: null`.

The full form is submitted with `member_ids: null` (modal ignores `dirtyFields`).

**File:** `apps/api/plane/app/serializers/module.py` lines 32–36

```python
member_ids = serializers.ListField(
    child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
    write_only=True,
    required=False,
    # allow_null NOT set — defaults to False
)
```

`null` sent as `member_ids` → DRF `ListField` validation fails → **400 Bad Request**.

---

## Why It Works on First Admin Grant but Fails After Revoke+Re-grant

| State                             | `currentProjectRole` SWR key | SWR status                | Race outcome                                                                              |
| --------------------------------- | ---------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| First admin grant (fresh session) | First value → unique key     | Cold cache → fetches once | `fetchModules` typically resolves last (project-scoped, more data) → `member_ids` correct |
| Revoke (non-admin)                | Key changes → refetch        | Fresh fetch               | `member_ids` may be correct or null depending on timing                                   |
| Re-grant admin                    | Key changes again → refetch  | Fresh fetch               | Race likely resolved by `fetchModulesSlim` winning last → `member_ids: null` stored       |

The first admin-grant session may not trigger the race (or `fetchModules` wins consistently).
After revoke+re-grant, the repeated SWR invalidation + refetch cycle repeatedly rolls the dice on
the race condition. Once `null` lands in the store, the form submits it.

---

## Evidence Summary

| Evidence                                                                                    | File                                                    | Line    |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------- |
| `WorkspaceModulesEndpoint` lacks `member_ids` annotation                                    | `apps/api/plane/app/views/workspace/module.py`          | 36–107  |
| `ModuleSerializer.member_ids` is a custom field, no source, not annotated in workspace view | `apps/api/plane/app/serializers/module.py`              | 209     |
| `fetchModulesSlim` uses workspace endpoint, spreads null into store                         | `apps/web/core/store/module.store.ts`                   | 317–335 |
| Both fetches use `{ ...existing, ...module }` — no null guard                               | `apps/web/core/store/module.store.ts`                   | 324     |
| SWR key includes `currentProjectRole` → invalidated on every role change                    | `apps/web/core/layouts/auth-layout/project-wrapper.tsx` | 129–135 |
| Form reset spreads null over `member_ids: []`                                               | `apps/web/core/components/modules/form.tsx`             | 76–81   |
| `ModuleWriteSerializer.member_ids` has no `allow_null=True`                                 | `apps/api/plane/app/serializers/module.py`              | 32–36   |
| `updateModuleDetails` optimistic update never merges API response on success                | `apps/web/core/store/module.store.ts`                   | 434–452 |

---

## Recommended Fixes (Priority Ordered)

### Fix 1 (Backend — Primary) — Add `member_ids` annotation to workspace modules endpoint

**File:** `apps/api/plane/app/views/workspace/module.py`

Add `ArrayAgg` annotation to the queryset (same pattern as `ModuleViewSet.get_queryset()`), or
switch from `ModuleSerializer` to `.values()` with the annotation, so `member_ids` is never null.

Alternatively, add `to_representation` to `ModuleSerializer` to compute `member_ids` from the
prefetched `members` M2M (already prefetched via `.prefetch_related("members")`):

```python
# In ModuleSerializer
def to_representation(self, instance):
    data = super().to_representation(instance)
    # Compute member_ids from prefetched M2M if annotation is absent
    if data.get("member_ids") is None:
        data["member_ids"] = [str(m.id) for m in instance.members.all()]
    return data
```

This is the safest fix — no query change needed, uses existing prefetch.

### Fix 2 (Backend — Defence in Depth) — Allow null on `ModuleWriteSerializer.member_ids`

**File:** `apps/api/plane/app/serializers/module.py` line 32

```python
member_ids = serializers.ListField(
    child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
    write_only=True,
    required=False,
    allow_null=True,  # ADD THIS
)
```

And handle `null` the same as `not provided` in `update()`:

```python
def update(self, instance, validated_data):
    members = validated_data.pop("member_ids", None)
    # null → treat as "not provided" (don't clear members)
    if members is not None:  # already the case — but now null passes validation
        ...
```

This makes the serializer resilient to accidental null from frontend, treating `null` the same
as field-omitted (no member change). This is a tolerance fix, not a root cause fix.

### Fix 3 (Frontend — Primary) — Guard null in store when merging module data

**File:** `apps/web/core/store/module.store.ts` — all merge sites

Add a null guard for `member_ids` when spreading module data into the store:

```typescript
// Utility helper
function normalizeModule(module: Partial<IModule>): Partial<IModule> {
  return {
    ...module,
    member_ids: module.member_ids ?? [],
  };
}
```

Apply in `fetchModulesSlim` (line 324), `fetchModules`, `fetchWorkspaceModules`, and
`fetchModuleDetails`.

### Fix 4 (Frontend — Defence in Depth) — Null guard in form reset

**File:** `apps/web/core/components/modules/form.tsx` line 76–81

```typescript
useEffect(() => {
  reset({
    ...defaultValues,
    ...data,
    member_ids: data?.member_ids ?? [], // guard null
  });
}, [data, reset]);
```

And in the form's `defaultValues`:

```typescript
member_ids: data?.member_ids ?? [],  // line 60 — already uses ||, but || also catches []
```

### Fix 5 (Frontend — Improvement) — Merge API response back into store on successful PATCH

**File:** `apps/web/core/store/module.store.ts` lines 434–452

Currently `updateModuleDetails` does the optimistic update but ignores the API response on
success. The response should replace the optimistic data:

```typescript
const response = await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, data);
runInAction(() => {
  set(this.moduleMap, [moduleId], { ...originalModuleDetails, ...response }); // use response, not data
});
```

This ensures the store always reflects actual API state, eliminating stale values entirely.

---

## Recommended Fix Sequence

1. **Fix 1** (backend serializer — workspace endpoint) — eliminates the source of null
2. **Fix 3** (store null guard) — prevents future nulls from any source
3. **Fix 4** (form null guard) — last-mile defense before submission
4. **Fix 2** (serializer allow_null) — tolerance for any remaining edge cases
5. **Fix 5** (store response merge) — general improvement for data consistency

Fixes 1 + 3 + 4 together are sufficient to resolve the reported bug completely.

---

## Unresolved Questions

- What does DRF return for `instance.member_ids` when the attribute is missing? Confirmed as `null`
  via the 400 payload evidence, but the exact DRF code path (SkipField vs None) should be verified
  with a test if Fix 1 is applied to the serializer `to_representation` approach.
- Are there other endpoints that use `ModuleSerializer` on querysets without the `member_ids`
  annotation? (`apps/api/plane/api/views/module.py` — the API v1 view — should be checked.)
