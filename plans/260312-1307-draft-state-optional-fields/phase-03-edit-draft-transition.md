# Phase 03 — Edit Form Draft → Non-Draft Transition Validation

## Context

- Plan: [plan.md](./plan.md)
- Branch: `ngoc-feat/workspaces`
- **Edit form component:** `apps/web/core/components/issues/issue-detail/sidebar.tsx` — state dropdown `onChange` at line 96
- State change path: `onChange={(val) => void issueOperations.update(..., { state_id: val })}`
- No RHF — MobX direct mutations only

<!-- Updated: Validation Session 6 - error feedback = toast + highlight fields; dropdown auto-reverts; fields hardcoded -->
<!-- Updated: Validation Session 7 - fieldErrors cleared on successful transition only; toast from @plane/propel; add i18n key issue.required_fields_missing -->

## Overview

When a workitem is currently in a **draft state** (group `"backlog"`) and the user picks a **non-draft state** in the edit sidebar, all required fields must be filled before the state change proceeds. If any required field is missing:

1. The update is aborted (dropdown reverts automatically — it is a controlled component)
2. Toast notification lists the missing fields
3. Each empty required field in the sidebar gets a red border / error highlight

## Required Fields

Same as creation form:

- `assignee_ids` — must have length > 0
- `start_date` — must be non-null
- `target_date` — must be non-null

## Architecture

```
apps/web/ce/hooks/use-draft-state-transition.ts        ← new (CE)
  └─> useDraftStateTransition()
       └─> validateTransition(issue, newStateId): string[]
            ├─ returns [] if not a draft→non-draft transition
            └─ returns missing field names if validation fails

apps/web/core/hooks/store/use-draft-state-transition.ts ← new (core shim)
  └─> re-exports from ce/

apps/web/core/components/issues/issue-detail/sidebar.tsx ← minimal change (core)
  └─> const { validateTransition } = useDraftStateTransition()
       └─> state onChange: check errors before issueOperations.update()
```

## Related Code Files

| File                                                       | Role                                         | Change                                     |
| ---------------------------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| `apps/web/ce/hooks/use-draft-state-transition.ts`          | **New** — CE hook with transition validation | Create                                     |
| `apps/web/core/hooks/store/use-draft-state-transition.ts`  | **New** — Core shim                          | Create                                     |
| `apps/web/core/components/issues/issue-detail/sidebar.tsx` | Edit form state dropdown                     | Intercept onChange, validate before update |

## Implementation Steps

### Step 1: Create CE hook `apps/web/ce/hooks/use-draft-state-transition.ts`

Hook returns both `missingFieldKeys` (for CSS highlight) and `missingFieldLabels` (for toast message).

```typescript
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { useProjectState } from "@/hooks/store/use-project-state";

type ValidationResult = {
  missingFieldKeys: string[]; // e.g. ["assignee_ids", "start_date"]
  missingFieldLabels: string[]; // e.g. ["Assignee", "Start date"]
};

export const useDraftStateTransition = () => {
  const { getStateById } = useProjectState();
  const { t } = useTranslation();

  const validateTransition = (issue: TIssue, newStateId: string): ValidationResult => {
    const currentState = getStateById(issue.state_id ?? "");
    const newState = getStateById(newStateId);

    // only validate draft → non-draft
    if (currentState?.group !== "backlog" || newState?.group === "backlog") {
      return { missingFieldKeys: [], missingFieldLabels: [] };
    }

    const missingFieldKeys: string[] = [];
    const missingFieldLabels: string[] = [];

    if (!issue.assignee_ids?.length) {
      missingFieldKeys.push("assignee_ids");
      missingFieldLabels.push(t("issue.add.assignee"));
    }
    if (!issue.start_date) {
      missingFieldKeys.push("start_date");
      missingFieldLabels.push(t("common.order_by.start_date"));
    }
    if (!issue.target_date) {
      missingFieldKeys.push("target_date");
      missingFieldLabels.push(t("issue.add.due_date"));
    }

    return { missingFieldKeys, missingFieldLabels };
  };

  return { validateTransition };
};
```

### Step 2: Create core shim `apps/web/core/hooks/store/use-draft-state-transition.ts`

```typescript
export { useDraftStateTransition } from "@/plane-web/hooks/use-draft-state-transition";
```

### Step 3: Update `sidebar.tsx` — intercept state onChange

Import:

```typescript
import { useDraftStateTransition } from "@/hooks/store/use-draft-state-transition";
import { toast } from "@plane/propel/toast"; // @plane/propel preferred per CLAUDE.md
```

In component body:

```typescript
const { validateTransition } = useDraftStateTransition();
```

Replace state dropdown onChange (line ~96). Track `fieldErrors` in component state for field highlighting:

```diff
+ const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const { validateTransition } = useDraftStateTransition();

  // state dropdown onChange
- onChange={(val) => void issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
+ onChange={(val) => {
+   const { missingFieldKeys, missingFieldLabels } = validateTransition(issue, val);
+   if (missingFieldKeys.length > 0) {
+     setFieldErrors(missingFieldKeys);
+     toast.error(`${t("issue.required_fields_missing")}: ${missingFieldLabels.join(", ")}`);
+     return;
+   }
+   setFieldErrors([]);
+   void issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val });
+ }}
```

Apply error class on each required field wrapper using `fieldErrors.includes("fieldKey")`:

```tsx
// assignee field wrapper
<div className={cn({ "border border-red-500 rounded": fieldErrors.includes("assignee_ids") })}>
  <MemberDropdown ... />
</div>

// start_date field wrapper
<div className={cn({ "border border-red-500 rounded": fieldErrors.includes("start_date") })}>
  <DateDropdown ... />
</div>

// target_date field wrapper
<div className={cn({ "border border-red-500 rounded": fieldErrors.includes("target_date") })}>
  <DateDropdown ... />
</div>
```

> Use the exact border/color token already used in the project (check `text-danger-primary` usage in sidebar — line ~199). `fieldErrors` clears only on successful state transition — no per-field onChange watchers needed.

> Check the exact toast hook already used in `sidebar.tsx` context and match that pattern.

### Step 4: Add i18n key

Locate the i18n JSON files (e.g., `packages/i18n/src/en.json` or similar) and add:

```json
"issue": {
  "required_fields_missing": "Required fields missing"
}
```

Search for the key `issue.add.assignee` to find the right file and nesting location.

### Step 5: Verify lint & types

```bash
pnpm check:lint
```

## Todo

- [x] Step 1: Create `apps/web/ce/hooks/use-draft-state-transition.ts`
- [x] Step 2: Create `apps/web/core/hooks/store/use-draft-state-transition.ts` (shim)
- [x] Step 3: Update `sidebar.tsx` — add `fieldErrors` state, validate onChange, apply error borders
- [x] Step 4: Add `issue.required_fields_missing` i18n key
- [x] Step 5: Run `pnpm check:lint`
- [ ] Manual test: edit workitem in draft state → change to non-draft with empty required fields → toast shown + empty fields highlighted red + dropdown reverts
- [ ] Manual test: edit workitem in draft state → fill required fields → change to non-draft → should succeed, errors clear + update proceeds
- [ ] Manual test: edit workitem in non-draft state → change state freely → no validation triggered

## Success Criteria

- State change from draft → non-draft in edit form blocked if `assignee_ids`, `start_date`, or `target_date` is empty
- Toast notification shows missing field names
- Non-draft → any state changes are unaffected
- Draft → draft state changes are unaffected
- No backend changes required
- Lint passes

## Risk Assessment

| Risk                                      | Likelihood | Impact | Mitigation                                                                                       |
| ----------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------ |
| Toast hook API differs from assumption    | Low        | Low    | Check existing toast usage in sidebar.tsx at implementation time                                 |
| i18n keys don't exist                     | Low        | Low    | Fallback to hardcoded strings if keys missing; add keys if needed                                |
| State data not loaded when onChange fires | Very Low   | Low    | `getStateById` returns undefined → group undefined → `!== "backlog"` → validation skipped (safe) |
