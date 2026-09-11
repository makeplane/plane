/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EIssuesStoreType, TIssue, TIssueGroupByOptions, TIssueOrderByOptions } from "@plane/types";
import type { GroupDropLocation } from "@/components/issues/issue-layouts/utils";
import { handleGroupDragDrop } from "@/components/issues/issue-layouts/utils";
import { updateIssueStateWithPropagation } from "@/helpers/issue-state-update";
import { ISSUE_FILTER_DEFAULT_DATA } from "@/store/issue/helpers/base-issues.store";
import { useIssueDetail } from "./store/use-issue-detail";
import { useIssues } from "./store/use-issues";
import { useIssuesActions } from "./use-issues-actions";

type DNDStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.PROFILE
  | EIssuesStoreType.ARCHIVED
  | EIssuesStoreType.WORKSPACE_DRAFT
  | EIssuesStoreType.TEAM
  | EIssuesStoreType.TEAM_VIEW
  | EIssuesStoreType.EPIC
  | EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS;

export const useGroupIssuesDragNDrop = (
  storeType: DNDStoreType,
  orderBy: TIssueOrderByOptions | undefined,
  groupBy: TIssueGroupByOptions | undefined,
  subGroupBy?: TIssueGroupByOptions
) => {
  const { workspaceSlug } = useParams();

  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { updateIssue } = useIssuesActions(storeType);
  const {
    issues: { getIssueIds, addCycleToIssue, removeCycleFromIssue, changeModulesInIssue },
  } = useIssues(storeType);

  /**
   * update Issue on Drop, checks if modules or cycles are changed and then calls appropriate functions
   * @param projectId
   * @param issueId
   * @param data
   * @param issueUpdates
   */
  const updateIssueOnDrop = async (
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    issueUpdates: {
      [groupKey: string]: {
        ADD: string[];
        REMOVE: string[];
      };
    }
  ) => {
    const errorToastProps = {
      type: TOAST_TYPE.ERROR,
      title: "Error!",
      message: "Error while updating work item",
    };
    const moduleKey = ISSUE_FILTER_DEFAULT_DATA["module"];
    const cycleKey = ISSUE_FILTER_DEFAULT_DATA["cycle"];

    const isModuleChanged = Object.keys(data).includes(moduleKey);
    const isCycleChanged = Object.keys(data).includes(cycleKey);

    const issue = getIssueById(issueId);
    const stateId = data.state_id;
    const needsPropagationPrompt = Boolean(
      stateId && issue && issue.sub_issues_count > 0 && stateId !== issue.state_id
    );

    const applyCycleAndModuleChanges = async () => {
      if (!workspaceSlug) return;

      if (isCycleChanged) {
        if (data[cycleKey]) {
          await addCycleToIssue(workspaceSlug.toString(), projectId, data[cycleKey]?.toString() ?? "", issueId);
        } else {
          await removeCycleFromIssue(workspaceSlug.toString(), projectId, issueId);
        }
      }

      if (isModuleChanged && issueUpdates[moduleKey]) {
        await changeModulesInIssue(
          workspaceSlug.toString(),
          projectId,
          issueId,
          issueUpdates[moduleKey].ADD,
          issueUpdates[moduleKey].REMOVE
        );
      }
    };

    const issueUpdateData = { ...data };
    if (isCycleChanged) delete issueUpdateData[cycleKey];
    if (isModuleChanged) delete issueUpdateData[moduleKey];

    const applyIssueUpdate = async (patchData: Partial<TIssue>) => {
      if (updateIssue) {
        await updateIssue(projectId, issueId, patchData);
      }
    };

    if (needsPropagationPrompt && issue && stateId) {
      try {
        await updateIssueStateWithPropagation({
          currentStateId: issue.state_id,
          newStateId: stateId,
          subIssuesCount: issue.sub_issues_count,
          onUpdate: async (stateUpdateData) => {
            await applyCycleAndModuleChanges();
            await applyIssueUpdate({ ...issueUpdateData, ...stateUpdateData });
          },
        });
      } catch (error) {
        console.error("Error while updating work item during drag-and-drop propagation:", error);
        setToast(errorToastProps);
      }
      return;
    }

    try {
      await applyCycleAndModuleChanges();
      await applyIssueUpdate(issueUpdateData);
    } catch (error) {
      console.error("Error while updating work item during drag-and-drop:", error);
      setToast(errorToastProps);
    }
  };

  const handleOnDrop = async (source: GroupDropLocation, destination: GroupDropLocation) => {
    if (
      source.columnId &&
      destination.columnId &&
      destination.columnId === source.columnId &&
      destination.id === source.id
    )
      return;

    await handleGroupDragDrop(
      source,
      destination,
      getIssueById,
      getIssueIds,
      updateIssueOnDrop,
      groupBy,
      subGroupBy,
      orderBy !== "sort_order"
    ).catch((err) => {
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: err?.detail ?? "Failed to perform this action",
      });
    });
  };

  return handleOnDrop;
};
