/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * the LiveWorkItemsApplier wiring shared by the two live hooks (use-live-work-items for the project
 * routes, use-live-workspace-view for the workspace views). Both used to build the same dependency object by
 * hand. A hook now passes only what differs: the route, the current user, the full-page work item and the
 * workspace view target.
 */

import { useCallback, useRef } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
// store
import type { RootStore } from "@/store/root.store";
// local imports
import type { ILiveApplierDeps, TLiveRoute } from "./apply";
import { refreshCycleAndModuleDefinitions, refreshEstimateDefinitions } from "./metadata";

type TApplierDepsParams = {
  workspaceSlug: string;
  projectId: string;
  getRoute: () => TLiveRoute;
  getCurrentUserId: () => string | undefined;
  getPageIssueId?: () => string | undefined;
  workspace?: ILiveApplierDeps["workspace"];
  /** shown when an open work item was deleted or is no longer visible (useWorkItemUnavailableNotice) */
  onIssueUnavailable: () => void;
};

/** The applier dependencies for one project, read from the root store. */
export const buildApplierDeps = (root: RootStore, params: TApplierDepsParams): ILiveApplierDeps => {
  const { workspaceSlug, projectId } = params;
  const issue = root.issue;
  return {
    workspaceSlug,
    projectId,
    getRoute: params.getRoute,
    getCurrentUserId: params.getCurrentUserId,
    getPageIssueId: params.getPageIssueId,
    workspace: params.workspace,
    issueMap: issue.issues,
    projectIssues: issue.projectIssues,
    cycleIssues: issue.cycleIssues,
    moduleIssues: issue.moduleIssues,
    viewIssues: issue.projectViewIssues,
    archivedIssues: issue.archivedIssues,
    projectInbox: root.projectInbox,
    issueDetail: issue.issueDetail,
    getStateGroup: (stateId) => root.state.stateMap?.[stateId]?.group,
    // unknown ids make the applier refresh the project's metadata once
    isKnownLabel: (labelId) => !!root.label.labelMap?.[labelId],
    isKnownState: (stateId) => !!root.state.stateMap?.[stateId],
    // an estimate point is known when one of the loaded estimates has it
    isKnownEstimatePoint: (pointId) =>
      Object.values(root.projectEstimate.estimates ?? {}).some((estimate) => !!estimate.estimatePoints?.[pointId]),
    getFilterExpression: (which) => {
      const filter = {
        project: issue.projectIssuesFilter,
        cycle: issue.cycleIssuesFilter,
        module: issue.moduleIssuesFilter,
        view: issue.projectViewIssuesFilter,
      }[which];
      return filter.issueFilters?.richFilters;
    },
    refreshProjectMetadata: () =>
      Promise.all([
        root.state.fetchProjectStates(workspaceSlug, projectId),
        root.label.fetchProjectLabels(workspaceSlug, projectId),
        // cycle and module definitions (quiet: no loader, deleted ones are dropped)
        refreshCycleAndModuleDefinitions(root, workspaceSlug, projectId),
        // estimate definitions (deleted ones are dropped)
        refreshEstimateDefinitions(root, workspaceSlug, projectId),
      ]),
    onIssueMissingFromPeek: params.onIssueUnavailable,
  };
};

/**
 * The "work item unavailable" toast, translated. The callback is stable, and reads the current
 * translation function, so an applier created once still shows the toast in the current language.
 */
export const useWorkItemUnavailableNotice = (): (() => void) => {
  const { t } = useTranslation();
  const translate = useRef(t);
  translate.current = t;
  return useCallback(
    () =>
      setToast({
        type: "info",
        title: translate.current("live_updates.work_item_unavailable.title"),
        message: translate.current("live_updates.work_item_unavailable.message"),
      }),
    []
  );
};
