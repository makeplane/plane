"use client";
import React, { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { LayersIcon, Plus } from "lucide-react";
import { ISearchIssueResponse, TIssue } from "@plane/types";
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };

export const SubIssuesActionButton: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, parentIssueId, customButton, disabled = false } = props;
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
    createSubIssues,
    isCreateIssueModalOpen,
    toggleCreateIssueModal,
    isSubIssuesModalOpen,
    toggleSubIssuesModal,
  } = useIssueDetail();
  const { setTrackElement } = useEventTracker();

  // operations
  const subIssueOperations = useMemo(
    () => ({
      addSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => {
        try {
          await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Sub-issues added successfully",
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error adding sub-issue",
          });
        }
      },
    }),
    [createSubIssues]
  );

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
  const issue = getIssueById(parentIssueId);

  if (!issue) return <></>;

  const handleCreateNew = () => {
    setTrackElement("Issue detail nested sub-issue");
    handleIssueCrudState("create", parentIssueId, null);
    toggleCreateIssueModal(true);
  };

  const handleAddExisting = () => {
    setTrackElement("Issue detail nested sub-issue");
    handleIssueCrudState("existing", parentIssueId, null);
    toggleSubIssuesModal(issue.id);
  };

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

  const handleCreateUpdateModalClose = () => {
    handleIssueCrudState("create", null, null);
    toggleCreateIssueModal(false);
  };

  const handleCreateUpdateModalOnSubmit = async (_issue: TIssue) => {
    if (_issue.parent_id) {
      await subIssueOperations.addSubIssue(workspaceSlug, projectId, parentIssueId, [_issue.id]);
    }
  };

  // existing issues modal
  const shouldRenderExistingIssuesModal =
    issueCrudState?.existing?.toggle && issueCrudState?.existing?.parentIssueId && isSubIssuesModalOpen;

  const existingIssuesModalSearchParams = { sub_issue: true, issue_id: issueCrudState?.existing?.parentIssueId };

  const handleExistingIssuesModalClose = () => {
    handleIssueCrudState("existing", null, null);
    toggleSubIssuesModal(null);
  };

  const handleExistingIssuesModalOnSubmit = async (_issue: ISearchIssueResponse[]) =>
    subIssueOperations.addSubIssue(
      workspaceSlug,
      projectId,
      parentIssueId,
      _issue.map((issue) => issue.id)
    );

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
