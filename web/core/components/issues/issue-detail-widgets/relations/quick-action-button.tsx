"use client";
import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { ISearchIssueResponse, TIssueRelationTypes } from "@plane/types";
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
// hooks
import { useIssueDetail } from "@/hooks/store";
// helper
import { ISSUE_RELATION_OPTIONS } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const RelationActionButton: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, customButton, issueId, disabled = false } = props;
  // state
  const [relationKey, setRelationKey] = useState<TIssueRelationTypes | null>(null);
  // store hooks
  const { createRelation, isRelationModalOpen, toggleRelationModal, setLastWidgetAction } = useIssueDetail();

  // handlers
  const handleOnClick = (relationKey: TIssueRelationTypes) => {
    setRelationKey(relationKey);
    toggleRelationModal(issueId, relationKey);
  };

  // submit handler
  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (!relationKey) return;
    if (data.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one issue.",
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

  const handleOnClose = () => {
    setRelationKey(null);
    toggleRelationModal(null, null);
    setLastWidgetAction("relations");
  };

  // button element
  const customButtonElement = customButton ? <>{customButton}</> : <Plus className="h-4 w-4" />;

  return (
    <>
      <CustomMenu customButton={customButtonElement} placement="bottom-start" disabled={disabled} closeOnSelect>
        {ISSUE_RELATION_OPTIONS.map((item, index) => (
          <CustomMenu.MenuItem
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOnClick(item.key as TIssueRelationTypes);
            }}
          >
            <div className="flex items-center gap-2">
              {item.icon(12)}
              <span>{item.label}</span>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>

      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isRelationModalOpen?.issueId === issueId && isRelationModalOpen?.relationType === relationKey}
        handleClose={handleOnClose}
        searchParams={{ issue_relation: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />
    </>
  );
});
