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
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  ISearchIssueResponse,
  TIssue,
  TIssueServiceType,
  TWorkItemRelationsSearchResponse,
  TWorkItemWidgets,
} from "@plane/types";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { DEPENDENCY_RELATION_KEYS } from "@/components/relations";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// helpers
import { useLinkOperations } from "./links/helper";
// local imports
import { IssueLinkCreateUpdateModal } from "../issue-detail/links/create-update-link-modal";
import { CreateUpdateIssueModal } from "../issue-modal/root";
import { useSubIssueOperations } from "./sub-issues/helper";
import { PagesMultiSelectModal } from "./pages/multi-select-modal";
import { SubWorkItemsListModal } from "../modals/add-sub-work-items/modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
};

export const IssueDetailWidgetModals = observer(function IssueDetailWidgetModals(props: Props) {
  const { workspaceSlug, projectId, issueId, issueServiceType, hideWidgets } = props;
  // store hooks
  const {
    issue: { getIssueById },
    isIssueLinkModalOpen,
    toggleIssueLinkModal: toggleIssueLinkModalStore,
    setIssueLinkData,
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
    togglePagesModal,
    isPagesModalOpen,
  } = useIssueDetail(issueServiceType);

  // helper hooks
  const subIssueOperations = useSubIssueOperations(issueServiceType);
  const handleLinkOperations = useLinkOperations(workspaceSlug, projectId, issueId, issueServiceType);
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const isCrossProjectSubWorkItemsEnabled = isWorkspaceFeatureEnabled(
    EWorkspaceFeatures.IS_CROSS_PROJECT_SUB_WORK_ITEMS_ENABLED
  );
  const issue = getIssueById(issueId);

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

  const handleExistingIssuesModalClose = () => {
    handleIssueCrudState("existing", null, null);
    setLastWidgetAction("sub-work-items");
    toggleSubIssuesModal(null);
  };

  const handleExistingIssuesModalOnSubmit = async (_workItems: TWorkItemRelationsSearchResponse[]) =>
    subIssueOperations.addSubIssue(
      workspaceSlug,
      projectId,
      issueId,
      _workItems.map((w) => w.id)
    );

  const handleCreateUpdateModalClose = () => {
    handleIssueCrudState("create", null, null);
    toggleCreateIssueModal(false);
    setLastWidgetAction("sub-work-items");
  };

  const handleCreateUpdateModalOnSubmit = async (_issue: TIssue) => {
    if (_issue.parent_id) {
      await subIssueOperations.addSubIssue(workspaceSlug, projectId, _issue.parent_id, [_issue.id]);
    }
  };

  const handleIssueLinkModalOnClose = () => {
    toggleIssueLinkModalStore(false);
    setLastWidgetAction("links");
    setIssueLinkData(null);
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
      issueId,
      relationKey,
      data.map((i) => i.id)
    );

    toggleRelationModal(null, null);
  };

  // helpers
  const createUpdateModalData: Partial<TIssue> = {
    parent_id: issueCrudOperationState?.create?.parentIssueId,
    project_id: projectId,
  };

  // render conditions
  const shouldRenderExistingIssuesModal =
    !hideWidgets?.includes("sub-work-items") &&
    issueCrudOperationState?.existing?.toggle &&
    issueCrudOperationState?.existing?.parentIssueId &&
    isSubIssuesModalOpen;

  const shouldRenderCreateUpdateModal =
    !hideWidgets?.includes("sub-work-items") &&
    issueCrudOperationState?.create?.toggle &&
    issueCrudOperationState?.create?.parentIssueId &&
    isCreateIssueModalOpen;

  const splittedRelationKey = relationKey?.split("::")[1];

  return (
    <>
      {!hideWidgets?.includes("links") && (
        <IssueLinkCreateUpdateModal
          isModalOpen={isIssueLinkModalOpen}
          handleOnClose={handleIssueLinkModalOnClose}
          linkOperations={handleLinkOperations}
          issueServiceType={issueServiceType}
        />
      )}

      {shouldRenderCreateUpdateModal && (
        <CreateUpdateIssueModal
          isOpen={issueCrudOperationState?.create?.toggle}
          data={createUpdateModalData}
          onClose={handleCreateUpdateModalClose}
          onSubmit={handleCreateUpdateModalOnSubmit}
        />
      )}

      {shouldRenderExistingIssuesModal && (
        <SubWorkItemsListModal
          projectId={projectId}
          isOpen={issueCrudOperationState?.existing?.toggle}
          handleClose={handleExistingIssuesModalClose}
          workItemId={issueId}
          handleSubmit={handleExistingIssuesModalOnSubmit}
          enableCrossProjectToggle={isCrossProjectSubWorkItemsEnabled}
        />
      )}

      {!hideWidgets?.includes("relations") || !hideWidgets?.includes("dependencies") ? (
        <ExistingIssuesListModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isOpen={isRelationModalOpen?.issueId === issueId && isRelationModalOpen?.relationType === relationKey}
          handleClose={handleRelationOnClose}
          searchParams={{
            issue_id: issueId,
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
      ) : null}

      <PagesMultiSelectModal
        issueServiceType={issueServiceType}
        workspaceSlug={workspaceSlug}
        projectId={issue?.project_id}
        workItemId={issueId}
        isOpen={isPagesModalOpen === issueId}
        onClose={() => {
          togglePagesModal(null);
        }}
        selectedPages={[]}
      />
    </>
  );
});
