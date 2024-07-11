"use client";
import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { LayersIcon, Plus } from "lucide-react";
import { ISearchIssueResponse, TIssue } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";
// helper
import { useSubIssueOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };

export const SubIssuesActionButton: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, customButton, disabled = false } = props;
  // state
  const [issueCrudState, setIssueCrudState] = useState<{
    create: TIssueCrudState;
    existing: TIssueCrudState;
  }>({
    create: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    existing: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
  });
  // store hooks
  const {
    issue: { getIssueById },
    isCreateIssueModalOpen,
    toggleCreateIssueModal,
    isSubIssuesModalOpen,
    toggleSubIssuesModal,
    setLastWidgetAction,
  } = useIssueDetail();
  const { setTrackElement } = useEventTracker();

  // helper
  const subIssueOperations = useSubIssueOperations();

  // handlers
  const handleIssueCrudState = (
    key: "create" | "existing",
    _parentIssueId: string | null,
    issue: TIssue | null = null
  ) => {
    setIssueCrudState({
      ...issueCrudState,
      [key]: {
        toggle: !issueCrudState[key].toggle,
        parentIssueId: _parentIssueId,
        issue: issue,
      },
    });
  };

  // derived values
  const issue = getIssueById(issueId);

  if (!issue) return <></>;

  const handleCreateNew = () => {
    setTrackElement("Issue detail nested sub-issue");
    handleIssueCrudState("create", issueId, null);
    toggleCreateIssueModal(true);
  };

  const handleAddExisting = () => {
    setTrackElement("Issue detail nested sub-issue");
    handleIssueCrudState("existing", issueId, null);
    toggleSubIssuesModal(issue.id);
  };

  const handleExistingIssuesModalClose = () => {
    handleIssueCrudState("existing", null, null);
    setLastWidgetAction("sub-issues");
    toggleSubIssuesModal(null);
  };

  const handleExistingIssuesModalOnSubmit = async (_issue: ISearchIssueResponse[]) =>
    subIssueOperations.addSubIssue(
      workspaceSlug,
      projectId,
      issueId,
      _issue.map((issue) => issue.id)
    );

  const handleCreateUpdateModalClose = () => {
    handleIssueCrudState("create", null, null);
    toggleCreateIssueModal(false);
    setLastWidgetAction("sub-issues");
  };

  const handleCreateUpdateModalOnSubmit = async (_issue: TIssue) => {
    if (_issue.parent_id) {
      await subIssueOperations.addSubIssue(workspaceSlug, projectId, issueId, [_issue.id]);
    }
  };

  // options
  const optionItems = [
    {
      label: "Create new",
      icon: <Plus className="h-3 w-3" />,
      onClick: handleCreateNew,
    },
    {
      label: "Add existing",
      icon: <LayersIcon className="h-3 w-3" />,
      onClick: handleAddExisting,
    },
  ];

  // create update modal
  const shouldRenderCreateUpdateModal =
    issueCrudState?.create?.toggle && issueCrudState?.create?.parentIssueId && isCreateIssueModalOpen;

  const createUpdateModalData = { parent_id: issueCrudState?.create?.parentIssueId };

  // existing issues modal
  const shouldRenderExistingIssuesModal =
    issueCrudState?.existing?.toggle && issueCrudState?.existing?.parentIssueId && isSubIssuesModalOpen;

  const existingIssuesModalSearchParams = { sub_issue: true, issue_id: issueCrudState?.existing?.parentIssueId };

  const customButtonElement = customButton ? <>{customButton}</> : <Plus className="h-4 w-4" />;
  return (
    <>
      <CustomMenu customButton={customButtonElement} placement="bottom-start" disabled={disabled} closeOnSelect>
        {optionItems.map((item, index) => (
          <CustomMenu.MenuItem
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.onClick();
            }}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>

      {shouldRenderCreateUpdateModal && (
        <CreateUpdateIssueModal
          isOpen={issueCrudState?.create?.toggle}
          data={createUpdateModalData}
          onClose={handleCreateUpdateModalClose}
          onSubmit={handleCreateUpdateModalOnSubmit}
        />
      )}

      {shouldRenderExistingIssuesModal && (
        <ExistingIssuesListModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isOpen={issueCrudState?.existing?.toggle}
          handleClose={handleExistingIssuesModalClose}
          searchParams={existingIssuesModalSearchParams}
          handleOnSubmit={handleExistingIssuesModalOnSubmit}
          workspaceLevelToggle
        />
      )}
    </>
  );
});
