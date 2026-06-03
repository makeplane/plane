---
phase: 3
title: "Integration & wiring"
status: completed
priority: P1
effort: "30m"
dependencies: [1, 2]
---

# Phase 3: Integration & Wiring

## Overview

Wire up the new components into the existing `/workspace/bulk-assign` page by adding a tab switcher.
No new route or nav entry needed.

## Requirements

- Functional:
  - Page title/description stays generic ("Bulk workspace member management" or similar)
  - Two tabs: "Bulk Assign" and "Bulk Delete"
  - Default tab: "Bulk Assign" (preserves existing behavior)
  - Each tab renders its own form independently (no shared state between tabs)
- Non-functional:
  - Tab state is local (`useState`) — no URL param needed, no persistence
  - Use `@plane/propel/tabs` or simple styled button tabs (check propel Tabs export)

## Related Code Files

- Modify: `apps/admin/app/(all)/(dashboard)/workspace/bulk-assign/page.tsx`

## Implementation Steps

1. In `page.tsx`, replace the single `<WorkspaceBulkAssignForm />` with a tab switcher:

```tsx
"use client";
import { useState } from "react";
import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceBulkAssignForm } from "@/components/workspace/workspace-bulk-assign-form";
import { WorkspaceBulkDeleteForm } from "@/components/workspace/workspace-bulk-delete-form";

type Tab = "assign" | "delete";

function WorkspaceBulkAssignPage() {
  const [activeTab, setActiveTab] = useState<Tab>("assign");

  return (
    <PageWrapper
      header={{
        title: "Bulk workspace member management",
        description: "Upload an Excel file to add or remove workspace members at once.",
      }}
    >
      <div className="pt-4 space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-border-subtle">
          {(["assign", "delete"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-secondary hover:text-primary",
              ].join(" ")}
            >
              {tab === "assign" ? "Bulk Assign" : "Bulk Delete"}
            </button>
          ))}
        </div>

        {activeTab === "assign" ? <WorkspaceBulkAssignForm /> : <WorkspaceBulkDeleteForm />}
      </div>
    </PageWrapper>
  );
}

export const meta = () => [{ title: "Bulk Workspace Member Management - God Mode" }];
export default WorkspaceBulkAssignPage;
```

2. Verify `WorkspaceBulkDeleteForm` is exported correctly from its file.

3. Run lint: `pnpm check:lint` — fix any issues.

4. Start dev server (`pnpm dev:local`) and manually verify:
   - "Bulk Assign" tab shows existing form and works as before
   - "Bulk Delete" tab shows delete form
   - Template download produces correct two-column Excel
   - Upload + submit reaches backend and shows results

## Success Criteria

- [ ] Page loads with "Bulk Assign" tab active by default
- [ ] Switching tabs preserves no state from the other tab
- [ ] Existing bulk-assign flow unchanged
- [ ] Bulk-delete flow submits to correct endpoint and shows results
- [ ] `pnpm check:lint` passes with no new errors

## Risk Assessment

- **`"use client"` directive**: page currently has no client directive — adding `useState` requires it. Confirm `PageWrapper` is client-compatible (it is, already used in other pages with hooks).
- **Propel Tabs**: if `@plane/propel/tabs` exports a `Tabs` component that fits, prefer it over manual button tabs to stay consistent. Check `packages/propel/package.json` exports before implementing.
