import useSWR from "swr";
import type { TBaseIssue } from "@plane/types";
// services
import { UserService } from "@/services/user.service";
import { CEUserWorkItemsService } from "@/plane-web/services/user-work-items.service";
// hooks
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
// types
import type { EnrichedIssue } from "@/plane-web/components/profile/work-items-table";

type WorkItemKind = "today" | "overdue";

const userService = new UserService();
const ceWorkItemsService = new CEUserWorkItemsService();

// Filter params shared across both legacy paths
const LEGACY_FILTER_PARAMS = {
  state_group: "backlog,unstarted,started",
  order_by: "target_date",
};

/**
 * Hook that fetches today/overdue work items with 3-branch logic:
 * 1. Other-user profile  → legacy per-workspace fan-out (toggle hidden, no aggregate)
 * 2. Feature flag off    → legacy fan-out across all workspaces (rollback path)
 * 3. Self + flag on      → new CE aggregate endpoint (1 request)
 */
export const useUserWorkItems = (
  kind: WorkItemKind,
  crossWorkspaces: boolean,
  currentWorkspaceSlug: string | undefined,
  userId: string
) => {
  const { data: currentUser } = useUser();
  const { workspaces } = useWorkspace();

  const isSelf = currentUser?.id === userId;
  const todayStr = new Date().toISOString().split("T")[0];
  // Feature flag: set VITE_USE_AGGREGATE_PROFILE_ENDPOINT=false to fall back to legacy fan-out path
  const useAggregateEndpoint = import.meta.env.VITE_USE_AGGREGATE_PROFILE_ENDPOINT !== "false";

  // Build SWR cache key — distinct per kind, user, scope, and day
  const swrKey =
    userId && currentWorkspaceSlug
      ? `WORK_ITEMS_${kind}_${userId}_${crossWorkspaces ? "ALL" : currentWorkspaceSlug}_${todayStr}`
      : null;

  const { data, isLoading, error } = useSWR(swrKey, async (): Promise<EnrichedIssue[]> => {
    // Branch 1: Other-user profile — legacy single-workspace endpoint
    if (!isSelf) {
      if (!currentWorkspaceSlug) return [];
      const filterParams = { ...LEGACY_FILTER_PARAMS, assignees: userId };
      try {
        const resp = await userService.getUserProfileIssues(currentWorkspaceSlug, userId, filterParams);
        const items = Array.isArray(resp?.results) ? (resp.results as TBaseIssue[]) : [];
        const ws = Object.values(workspaces ?? {}).find((w) => w.slug === currentWorkspaceSlug);
        // Sub-task parity with self-view aggregate endpoint: legacy endpoint doesn't filter parent_id.
        return items
          .filter((issue) => issue.parent_id == null)
          .map(
            (issue): EnrichedIssue => ({
              ...issue,
              _workspaceSlug: currentWorkspaceSlug,
              _workspaceName: ws?.name ?? currentWorkspaceSlug,
              _project: undefined,
              _state: undefined,
            })
          );
      } catch (err) {
        console.warn(`[useUserWorkItems] legacy fetch failed for ${currentWorkspaceSlug}:`, err);
        return [];
      }
    }

    // Branch 2: Feature flag off — legacy fan-out across all workspaces
    if (!useAggregateEndpoint) {
      const allSlugs = Object.values(workspaces ?? {}).map((ws) => ws.slug);
      const slugsToFetch = crossWorkspaces ? allSlugs : currentWorkspaceSlug ? [currentWorkspaceSlug] : [];
      if (slugsToFetch.length === 0) return [];
      const filterParams = { ...LEGACY_FILTER_PARAMS, assignees: userId };
      const results = await Promise.all(
        slugsToFetch.map(async (slug): Promise<EnrichedIssue[]> => {
          try {
            const resp = await userService.getUserProfileIssues(slug, userId, filterParams);
            const items = Array.isArray(resp?.results) ? (resp.results as TBaseIssue[]) : [];
            const ws = Object.values(workspaces ?? {}).find((w) => w.slug === slug);
            return items
              .filter((issue) => issue.parent_id == null)
              .map(
                (issue): EnrichedIssue => ({
                  ...issue,
                  _workspaceSlug: slug,
                  _workspaceName: ws?.name ?? slug,
                  _project: undefined,
                  _state: undefined,
                })
              );
          } catch (err) {
            console.warn(`[useUserWorkItems] fan-out fetch failed for ${slug}:`, err);
            return [];
          }
        })
      );
      return results.flat();
    }

    // Branch 3: Self + aggregate endpoint (default happy path)
    const workspaceParam = crossWorkspaces ? undefined : currentWorkspaceSlug;
    return ceWorkItemsService.list(kind, { workspace: workspaceParam });
  });

  return { data: data ?? [], isLoading, error };
};
