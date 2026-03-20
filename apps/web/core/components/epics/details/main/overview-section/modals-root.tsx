/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { ISearchIssueResponse, TIssue, TWorkItemRelationsSearchResponse } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/root";
import { DEPENDENCY_RELATION_KEYS } from "@/components/relations";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web hooks
import { useIssueTypes, useEpicAnalytics, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import { SubWorkItemsListModal } from "@/components/issues/modals/add-sub-work-items/modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
};

export const EpicOverviewWidgetModals = observer(function EpicOverviewWidgetModals(props: Props) {
  const { workspaceSlug, projectId, epicId } = props;
  // store hooks
  const {
    isCreateIssueModalOpen,
    toggleCreateIssueModal,
    isSubIssuesModalOpen,
    toggleSubIssuesModal,
    relationKey,
    isRelationModalOpen,
    setRelationKey,
    setLastWidgetAction,
    toggleRelationModal,
    createRelation,
    issueCrudOperationState,
    setIssueCrudOperationState,
    createSubIssues: createEpicSubIssues,
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { createSubIssues } = useIssueDetail();
  const { getIssueTypeById } = useIssueTypes();
  const { fetchEpicAnalytics } = useEpicAnalytics();
  // derived values
  const isCrossProjectSubWorkItemsEnabled = isWorkspaceFeatureEnabled(
    EWorkspaceFeatures.IS_CROSS_PROJECT_SUB_WORK_ITEMS_ENABLED
  );

  const handleAddSubIssueResponse = (successMessage: string) => {
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Success!",
      message: successMessage,
    });
  };

  const handleAddSubIssueError = () => {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: "Error!",
      message: "Error adding work item",
    });
  };

  const addSubIssueToEpic = async (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueIds: string[]
  ) => {
    try {
      await createEpicSubIssues(workspaceSlug, projectId, parentIssueId, issueIds).then(() => {
        fetchEpicAnalytics(workspaceSlug, projectId, epicId);
        handleAddSubIssueResponse("Work items added successfully");
        return;
      });
    } catch {
      handleAddSubIssueError();
    }
  };

  const addSubIssue = async (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => {
    try {
      await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds).then(() => {
        handleAddSubIssueResponse("Work items added successfully");
        return;
      });
    } catch {
      handleAddSubIssueError();
    }
  };

  // handlers
  const handleIssueCrudState = (
    key: "create" | "existing",
    _parentIssueId: string | null,
    issue: TIssue | null = null
  ) => {
    setIssueCrudOperationState({
      ...issueCrudOperationState,
      [key]: {
        toggle: !issueCrudOperationState[key].toggle,
        parentIssueId: _parentIssueId,
        issue: issue,
      },
    });
  };

  const handleSubWorkItemsModalClose = () => {
    handleIssueCrudState("existing", null, null);
    setLastWidgetAction("sub-work-items");
    toggleSubIssuesModal(null);
  };

  const handleSubWorkItemsModalOnSubmit = async (_workItems: TWorkItemRelationsSearchResponse[]) =>
    await addSubIssueToEpic(
      workspaceSlug,
      projectId,
      epicId,
      _workItems.map((workItem) => workItem.id)
    );

  const handleCreateUpdateModalClose = () => {
    handleIssueCrudState("create", null, null);
    toggleCreateIssueModal(false);
    setLastWidgetAction("sub-work-items");
  };

  // derived values

  const handleCreateUpdateModalOnSubmit = async (_issue: TIssue) => {
    if (_issue.parent_id) {
      const parentIssue = getIssueById(_issue.parent_id);
      const parentIssueTypeDetails = parentIssue?.type_id ? getIssueTypeById(parentIssue.type_id) : undefined;
      const isParentEpic = parentIssueTypeDetails?.is_epic;

      if (isParentEpic) {
        await addSubIssueToEpic(workspaceSlug, projectId, _issue.parent_id, [_issue.id]);
      } else {
        await addSubIssue(workspaceSlug, projectId, _issue.parent_id, [_issue.id]);
      }
    }
  };

  const handleRelationOnClose = () => {
    const isDependency = relationKey ? DEPENDENCY_RELATION_KEYS.has(relationKey) : false;
    setRelationKey(null);
    toggleRelationModal(null, null);
    setLastWidgetAction(isDependency ? "dependencies" : "relations");
  };

  const handleExistingIssueModalOnSubmit = async (data: ISearchIssueResponse[]) => {
    if (!relationKey) return;
    if (data.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one work item.",
      });
      return;
    }

    await createRelation(
      workspaceSlug,
      projectId,
      epicId,
      relationKey,
      data.map((i) => i.id)
    );

    toggleRelationModal(null, null);
  };

  // helpers
  const createUpdateModalData = {
    parent_id: issueCrudOperationState?.create?.parentIssueId,
    project_id: projectId,
  };

  // render conditions
  const shouldRenderSubWorkItemsModal =
    issueCrudOperationState?.existing?.toggle &&
    issueCrudOperationState?.existing?.parentIssueId &&
    isSubIssuesModalOpen;

  const shouldRenderCreateUpdateModal =
    issueCrudOperationState?.create?.toggle && issueCrudOperationState?.create?.parentIssueId && isCreateIssueModalOpen;

  const splittedRelationKey = relationKey?.split("::")[1];

  return (
    <>
      {shouldRenderCreateUpdateModal && (
        <CreateUpdateIssueModal
          isOpen={issueCrudOperationState?.create?.toggle}
          data={createUpdateModalData}
          onClose={handleCreateUpdateModalClose}
          onSubmit={handleCreateUpdateModalOnSubmit}
          storeType={EIssuesStoreType.PROJECT}
        />
      )}

      {shouldRenderSubWorkItemsModal && (
        <SubWorkItemsListModal
          projectId={projectId}
          isOpen={issueCrudOperationState?.existing?.toggle}
          handleClose={handleSubWorkItemsModalClose}
          workItemId={epicId}
          handleSubmit={handleSubWorkItemsModalOnSubmit}
          enableCrossProjectToggle={isCrossProjectSubWorkItemsEnabled}
        />
      )}

      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isRelationModalOpen?.issueId === epicId && isRelationModalOpen?.relationType === relationKey}
        handleClose={handleRelationOnClose}
        searchParams={{
          issue_id: epicId,
          ...(relationKey && DEPENDENCY_RELATION_KEYS.has(relationKey)
            ? { issue_relation: true }
            : {
                issue_custom_relation: true,
                issue_custom_relation_type: splittedRelationKey || undefined,
              }),
        }}
        handleOnSubmit={handleExistingIssueModalOnSubmit}
        workspaceLevelToggle
      />
    </>
  );
});
