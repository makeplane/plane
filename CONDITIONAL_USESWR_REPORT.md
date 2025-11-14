# Conditional useSWR Calls - Analysis Report

This report analyzes all instances of `useSWR` usage in the codebase, distinguishing between **correct conditional usage** (using conditional keys) and **incorrect usage** (calling hooks before early returns).

## Important Distinction

### ✅ CORRECT: Conditional Keys
```tsx
// This is CORRECT - useSWR with conditional key
useSWR(
  condition ? 'key' : null,
  condition ? fetcher : null
);
```
This is the **recommended pattern** by SWR documentation. When the key is `null`, SWR will not fetch.

### ❌ INCORRECT: Hooks Before Early Returns
```tsx
// This is INCORRECT - violates Rules of Hooks
useSWR('key', fetcher);
if (!data) return null; // Early return after hook
```

---

## Files with **INCORRECT** useSWR Usage (Violates Rules of Hooks)

### 1. apps/space/core/components/issues/issue-layouts/root.tsx

**Lines 28-43:** useSWR is called, followed by early return on line 51

```tsx
const { getIssueFilters } = useIssueFilter();
const { fetchPublicIssues } = useIssue();
const issueDetailStore = useIssueDetails();

const { error } = useSWR(
  anchor ? `PUBLIC_ISSUES_${anchor}` : null,
  anchor
    ? () => fetchPublicIssues(anchor, "init-loader", { groupedBy: "state", canGroup: true, perPageCount: 50 })
    : null,
  { revalidateIfStale: false, revalidateOnFocus: false }
);

useEffect(() => {
  if (peekId) {
    issueDetailStore.setPeekId(peekId.toString());
  }
}, [peekId, issueDetailStore]);

if (!anchor) return null; // ❌ Early return after useSWR
```

**Issue:** The `useSWR` hook and `useEffect` are called before the early return. If `anchor` changes from truthy to falsy between renders, this violates the Rules of Hooks.

---

### 2. apps/space/app/issues/[anchor]/page.tsx

**Lines 15-28:** Multiple hooks including useSWR are called, followed by early return

```tsx
const params = useParams<{ anchor: string }>();
const { anchor } = params;
const searchParams = useSearchParams();
const peekId = searchParams.get("peekId") || undefined;

const { fetchStates } = useStates();
const { fetchLabels } = useLabel();

useSWR(anchor ? `PUBLIC_STATES_${anchor}` : null, anchor ? () => fetchStates(anchor) : null);
useSWR(anchor ? `PUBLIC_LABELS_${anchor}` : null, anchor ? () => fetchLabels(anchor) : null);

const publishSettings = usePublish(anchor);

if (!publishSettings) return null; // ❌ Early return after multiple hooks
```

**Issue:** Multiple hooks are called including two `useSWR` calls before checking `publishSettings` and returning early.

---

### 3. apps/web/core/layouts/auth-layout/workspace-wrapper.tsx

**Lines 47-116:** Multiple useSWR calls followed by early returns on lines 129, 140, 197

```tsx
const { workspaceSlug } = useParams();
const { signOut, data: currentUser } = useUser();
// ... many more hooks

useSWR(
  workspaceSlug && currentWorkspace ? WORKSPACE_MEMBER_ME_INFORMATION(workspaceSlug.toString()) : null,
  workspaceSlug && currentWorkspace ? () => fetchUserWorkspaceInfo(workspaceSlug.toString()) : null,
  { revalidateIfStale: false, revalidateOnFocus: false }
);
// ... 5 more useSWR calls

const handleSignOut = async () => { /* ... */ };

// ❌ Multiple early returns after all hooks
if (isParentLoading || allWorkspaces === undefined || loader) {
  return <div>Loading...</div>;
}

if (currentWorkspace === undefined && !currentWorkspaceInfo) {
  return <div>Workspace not found</div>;
}

if (currentWorkspaceInfo === undefined) {
  return <div>Not Authorized</div>;
}
```

**Issue:** 6 `useSWR` calls are made along with many other hooks before multiple conditional returns. This is a severe violation as the number of hooks can vary significantly between renders.

---

### 4. apps/web/core/layouts/auth-layout/project-wrapper.tsx

Similar pattern to workspace-wrapper.tsx - multiple useSWR calls before conditional rendering/returns.

**Lines 88-144:** 9 useSWR calls followed by conditional returns

```tsx
useSWR(/* PROJECT_DETAILS */);
useSWR(/* PROJECT_ME_INFORMATION */);
useSWR(/* PROJECT_LABELS */);
useSWR(/* PROJECT_MEMBERS */);
useSWR(/* PROJECT_STATES */);
useSWR(/* PROJECT_ESTIMATES */);
useSWR(/* PROJECT_ALL_CYCLES */);
useSWR(/* PROJECT_MODULES */);
useSWR(/* PROJECT_VIEWS */);

// Then conditional returns follow...
```

---

## Files with **CORRECT** useSWR Usage (Conditional Keys)

The following files use useSWR correctly with conditional keys. While there are many instances, they all follow the correct pattern:

### Examples of Correct Usage:

1. **apps/web/core/hooks/use-workspace-issue-properties.ts**
   - Lines 21-46: 4 useSWR calls with conditional keys
   ```tsx
   useSWR(
     workspaceSlug ? WORKSPACE_MODULES(workspaceSlug.toString()) : null,
     workspaceSlug ? () => fetchWorkspaceModules(workspaceSlug.toString()) : null,
     { revalidateIfStale: false, revalidateOnFocus: false }
   );
   ```

2. **apps/web/core/components/cycles/active-cycle/use-cycles-details.ts**
   - Lines 37-64: Multiple useSWR calls with complex conditional keys
   ```tsx
   useSWR(
     workspaceSlug && projectId && cycle?.id ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS_${cycle.id}` : null,
     workspaceSlug && projectId && cycle?.id ? () => fetchActiveCycleProgress(workspaceSlug, projectId, cycle.id) : null,
     { revalidateIfStale: false, revalidateOnFocus: false }
   );
   ```

3. **apps/web/core/components/home/widgets/recents/index.tsx**
   - Lines 44-58: Correct conditional key usage
   ```tsx
   const { data: recents, isLoading } = useSWR(
     workspaceSlug ? `WORKSPACE_RECENT_ACTIVITY_${workspaceSlug}_${filter}` : null,
     workspaceSlug
       ? () => workspaceService.fetchWorkspaceRecents(workspaceSlug.toString(), filter === filters[0].name ? undefined : filter)
       : null,
     { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
   );
   ```

4. **apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/page.tsx**
   - Lines 30-32: Conditional key based on permissions
   ```tsx
   const { data: appIntegrations } = useSWR(
     isAdmin ? APP_INTEGRATIONS : null,
     () => isAdmin ? integrationService.getAppIntegrationsList() : null
   );
   ```

5. **apps/web/core/lib/wrappers/instance-wrapper.tsx**
   - Lines 19-23: Unconditional useSWR (also correct)
   ```tsx
   const { isLoading: isInstanceSWRLoading, error: instanceSWRError } = useSWR(
     "INSTANCE_INFORMATION",
     async () => await fetchInstanceInfo(),
     { revalidateOnFocus: false }
   );
   ```

### Other files with correct conditional key usage:
- apps/web/core/components/project/integration-card.tsx
- apps/web/core/components/integration/single-integration-card.tsx
- apps/web/core/components/integration/guide.tsx
- apps/web/core/components/integration/github/root.tsx
- apps/web/core/components/integration/github/select-repository.tsx
- apps/web/core/components/integration/slack/select-channel.tsx
- apps/web/core/components/integration/jira/jira-project-detail.tsx
- apps/web/core/components/integration/jira/import-users.tsx
- apps/web/core/components/integration/github/single-user-select.tsx
- apps/web/core/components/integration/github/repo-details.tsx
- apps/web/core/components/inbox/content/root.tsx
- apps/web/core/components/exporter/prev-exports.tsx
- apps/web/core/components/estimates/root.tsx
- apps/web/core/components/analytics/work-items/priority-chart.tsx
- apps/web/core/components/analytics/work-items/created-vs-resolved.tsx
- apps/web/core/components/analytics/total-insights.tsx
- apps/web/core/components/profile/activity/profile-activity-list.tsx
- apps/web/core/components/profile/activity/workspace-activity-list.tsx
- apps/web/core/components/workspace/views/views-list.tsx
- apps/web/core/components/analytics/overview/active-projects.tsx
- apps/admin/app/(all)/(dashboard)/general/intercom.tsx
- apps/admin/app/(all)/(dashboard)/authentication/*.tsx (multiple files)
- Plus ~50 more files following the correct pattern

---

## Summary

### Violations Found: **4 files** with Rules of Hooks violations

1. ❌ **apps/space/core/components/issues/issue-layouts/root.tsx** - useSWR + useEffect before early return
2. ❌ **apps/space/app/issues/[anchor]/page.tsx** - Multiple hooks including 2 useSWR calls before early return
3. ❌ **apps/web/core/layouts/auth-layout/workspace-wrapper.tsx** - 6 useSWR calls before multiple early returns
4. ❌ **apps/web/core/layouts/auth-layout/project-wrapper.tsx** - 9 useSWR calls before conditional returns

### Correct Usage: **~90+ files** using conditional keys properly

The vast majority of useSWR usage in the codebase follows the correct pattern of using conditional keys (`condition ? key : null`), which is the recommended approach.

---

## Recommendations

### For the 4 Violating Files:

The issue is not with the conditional keys (which are correct), but with calling these hooks before early returns. To fix:

#### Pattern 1: Remove Early Returns
```tsx
// Before (❌)
const Component = () => {
  useSWR(key, fetcher);
  if (!data) return null;
  return <div>...</div>;
};

// After (✅)
const Component = () => {
  useSWR(key, fetcher);
  return (
    <>
      {data && <div>...</div>}
    </>
  );
};
```

#### Pattern 2: Extract to Child Component
```tsx
// Before (❌)
const Parent = ({ id }) => {
  useSWR(key, fetcher);
  if (!id) return null;
  return <div>...</div>;
};

// After (✅)
const Parent = ({ id }) => {
  if (!id) return null;
  return <Child id={id} />;
};

const Child = ({ id }) => {
  useSWR(key, fetcher); // Now safe
  return <div>...</div>;
};
```

---

## Key Takeaway

**Most useSWR usage is correct!** The issue is specifically with calling hooks before early returns in 4 files, not with the conditional key pattern itself.

---

**Report Generated:** ${new Date().toISOString()}
**Total useSWR Files Analyzed:** ~96 files
**Files with Violations:** 4 files  
**Files with Correct Usage:** ~92 files

