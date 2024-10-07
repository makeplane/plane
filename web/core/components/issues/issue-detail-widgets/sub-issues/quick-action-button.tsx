"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { LayersIcon, Plus } from "lucide-react";
import { TIssue } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";

type Props = {
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const SubIssuesActionButton: FC<Props> = observer((props) => {
  const { issueId, customButton, disabled = false } = props;
  // store hooks
  const {
    issue: { getIssueById },
    toggleCreateIssueModal,
    toggleSubIssuesModal,
    setIssueCrudOperationState,
    issueCrudOperationState,
  } = useIssueDetail();
  const { setTrackElement } = useEventTracker();

  // derived values
  const issue = getIssueById(issueId);

  if (!issue) return <></>;

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

  // button element
  const customButtonElement = customButton ? <>{customButton}</> : <Plus className="h-4 w-4" />;

  return (
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
  );
});
