/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { sortBy } from "lodash-es";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { StoreContext } from "@/lib/store-context";
// local imports
import { LiveWorkItemsApplier, listedIssueIds } from "./apply";
import { buildApplierDeps, useWorkItemUnavailableNotice } from "./applier-deps";
import { getLiveEventsClient } from "./client";

/**
 * at most this many projects are subscribed for a workspace view (the hub allows 100 per socket).
 * beyond it, the projects whose work items are in the view come first (pickWorkspaceViewProjects);
 * work items of projects left out still update on the next load.
 */
export const MAX_WORKSPACE_VIEW_PROJECTS = 50;

/** a change of the subscribed project set waits this long, so loading or paging a view does not churn */
export const PROJECT_SET_SETTLE_MS = 3000;

/**
 * the projects a workspace view subscribes to. Up to the cap, every joined project (sidebar order).
 * Beyond it, the joined projects whose work items are in the loaded view come first, then the rest in sidebar
 * order, so the projects the user is looking at are live.
 */
export const pickWorkspaceViewProjects = (joined: string[], present: Set<string>, max: number): string[] => {
  if (joined.length <= max) return joined;
  return [...joined.filter((id) => present.has(id)), ...joined.filter((id) => !present.has(id))].slice(0, max);
};

/**
 * keeps a workspace view (all, assigned, created, subscribed, or a saved workspace view) live.
 *
 * The workspace views route is outside the project layout, so useLiveWorkItems is not mounted there. This
 * hook subscribes to the user's joined projects in one subscribe frame (subscribeMany) and runs one
 * LiveWorkItemsApplier per project: each one applies its project's events to the workspace issues store
 * (and to an open peek), with the view's filter evaluated per work item. The appliers share one
 * list refetch, so a full refresh or a coarse view over several projects costs one request.
 */
export const useLiveWorkspaceView = (workspaceSlug: string | undefined, globalViewId: string | undefined) => {
  const root = useContext(StoreContext);
  const { data: currentUser } = useUser();
  const { joinedProjectIds } = useProject();
  // translated, and stable across renders
  const notifyUnavailable = useWorkItemUnavailableNotice();

  // read by the appliers without recreating them when the view changes
  const latest = useRef({ globalViewId, userId: currentUser?.id });
  latest.current = { globalViewId, userId: currentUser?.id };
  const stores = useRef({ root, notifyUnavailable });
  stores.current = { root, notifyUnavailable };

  // beyond the cap, the projects present in the loaded view are subscribed first
  const present = new Set<string>();
  if (root && joinedProjectIds.length > MAX_WORKSPACE_VIEW_PROJECTS) {
    for (const id of listedIssueIds(root.issue.workspaceIssues.groupedIssueIds)) {
      const issueProjectId = root.issue.issues.getIssueById(id)?.project_id;
      if (issueProjectId) present.add(issueProjectId);
    }
  }
  // the subscription follows the set of projects only (sorted, so a reorder does not resubscribe); the first set
  // applies at once, later changes after PROJECT_SET_SETTLE_MS (the hub rate-limits subscribe frames per user)
  const candidateKey = sortBy(pickWorkspaceViewProjects(joinedProjectIds, present, MAX_WORKSPACE_VIEW_PROJECTS)).join(
    ","
  );
  const [projectKey, setProjectKey] = useState(candidateKey);
  useEffect(() => {
    if (candidateKey === projectKey) return;
    if (!projectKey) {
      setProjectKey(candidateKey);
      return;
    }
    const timer = setTimeout(() => setProjectKey(candidateKey), PROJECT_SET_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [candidateKey, projectKey]);

  useEffect(() => {
    const { root: rootStore, notifyUnavailable: notify } = stores.current;
    const projectIds = projectKey ? projectKey.split(",") : [];
    if (!workspaceSlug || !rootStore || projectIds.length === 0) return;
    const workspaceIssues = rootStore.issue.workspaceIssues;
    const workspaceFilter = rootStore.issue.workspaceIssuesFilter;

    // one list refetch at a time for the whole view, shared by the per-project appliers
    let inflight: Promise<unknown> | null = null;
    const refetch = () => {
      const viewId = latest.current.globalViewId;
      if (!viewId) return Promise.resolve();
      inflight ??= workspaceIssues.fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation").finally(() => {
        inflight = null;
      });
      return inflight;
    };

    const appliers = new Map<string, LiveWorkItemsApplier>();
    for (const projectId of projectIds) {
      appliers.set(
        projectId,
        new LiveWorkItemsApplier(
          buildApplierDeps(rootStore, {
            workspaceSlug,
            projectId,
            getRoute: () => ({ globalViewId: latest.current.globalViewId }),
            getCurrentUserId: () => latest.current.userId,
            workspace: {
              issues: workspaceIssues,
              refetch,
              getRichFilters: () => workspaceFilter.getIssueFilters(latest.current.globalViewId)?.richFilters,
            },
            onIssueUnavailable: notify,
          })
        )
      );
    }

    const unsubscribe = getLiveEventsClient().subscribeMany(workspaceSlug, projectIds, (event) =>
      appliers.get(event.project_id)?.handle(event)
    );
    return () => {
      unsubscribe();
      appliers.forEach((applier) => applier.dispose());
    };
  }, [workspaceSlug, projectKey]);
};
