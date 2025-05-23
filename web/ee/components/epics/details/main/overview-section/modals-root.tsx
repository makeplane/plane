import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType, EIssuesStoreType } from "@plane/constants";
import { ISearchIssueResponse, TIssue } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web hooks
import { useIssueTypes, useEpicAnalytics } from "@/plane-web/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
};

export const EpicOverviewWidgetModals: FC<Props> = observer((props) => {
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
  const { createSubIssues } = useIssueDetail();
  const { getIssueTypeById } = useIssueTypes();
  const { fetchEpicAnalytics } = useEpicAnalytics();

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
      });
    } catch (error) {
      handleAddSubIssueError();
    }
  };

  const addSubIssue = async (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => {
    try {
      await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds).then(() => {
        handleAddSubIssueResponse("Work items added successfully");
      });
    } catch (error) {
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

  const handleExistingIssuesModalClose = () => {
    handleIssueCrudState("existing", null, null);
    setLastWidgetAction("sub-work-items");
    toggleSubIssuesModal(null);
  };

  const handleExistingIssuesModalOnSubmit = async (_issue: ISearchIssueResponse[]) =>
    await addSubIssueToEpic(
      workspaceSlug,
      projectId,
      epicId,
      _issue.map((issue) => issue.id)
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
    setRelationKey(null);
    toggleRelationModal(null, null);
    setLastWidgetAction("relations");
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
  const createUpdateModalData = { parent_id: issueCrudOperationState?.create?.parentIssueId, project_id: projectId };

  const existingIssuesModalSearchParams = {
    sub_issue: true,
    issue_id: issueCrudOperationState?.existing?.parentIssueId,
  };

  // render conditions
  const shouldRenderExistingIssuesModal =
    issueCrudOperationState?.existing?.toggle &&
    issueCrudOperationState?.existing?.parentIssueId &&
    isSubIssuesModalOpen;

  const shouldRenderCreateUpdateModal =
    issueCrudOperationState?.create?.toggle && issueCrudOperationState?.create?.parentIssueId && isCreateIssueModalOpen;

  return (
    <>
      {shouldRenderCreateUpdateModal && (
        <CreateUpdateIssueModal
          isOpen={issueCrudOperationState?.create?.toggle}
          data={createUpdateModalData}
          onClose={handleCreateUpdateModalClose}
          onSubmit={handleCreateUpdateModalOnSubmit}
          isProjectSelectionDisabled
          storeType={EIssuesStoreType.PROJECT}
        />
      )}

      {shouldRenderExistingIssuesModal && (
        <ExistingIssuesListModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isOpen={issueCrudOperationState?.existing?.toggle}
          handleClose={handleExistingIssuesModalClose}
          searchParams={existingIssuesModalSearchParams}
          handleOnSubmit={handleExistingIssuesModalOnSubmit}
        />
      )}

      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isRelationModalOpen?.issueId === epicId && isRelationModalOpen?.relationType === relationKey}
        handleClose={handleRelationOnClose}
        searchParams={{ issue_relation: true, issue_id: epicId }}
        handleOnSubmit={handleExistingIssueModalOnSubmit}
        workspaceLevelToggle
      />
    </>
  );
});
