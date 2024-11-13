"use client";

import { FC } from "react";
// types
import { TDeDupeIssue } from "@plane/types";
// components
import { TIssueOperations } from "@/components/issues";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// local components
import { DeDupeIssueBlockContent, DeDupeIssueBlockWrapper } from "../issue-block";
import { DeDupeIssueBlockHeader } from "./block-header";

type TDeDupeIssueBlockRootProps = {
  workspaceSlug: string;
  issue: TDeDupeIssue;
  selectionHelpers: TSelectionHelper;
  issueOperations?: TIssueOperations;
  disabled?: boolean;
  renderDeDupeActionModals?: boolean;
  isIntakeIssue?: boolean;
};

export const DeDupeIssueBlockRoot: FC<TDeDupeIssueBlockRootProps> = (props) => {
  const {
    workspaceSlug,
    issue,
    selectionHelpers,
    issueOperations,
    disabled = false,
    renderDeDupeActionModals,
    isIntakeIssue = false,
  } = props;
  // derived values
  const isSelected = selectionHelpers.getIsEntitySelected(issue.id);
  return (
    <DeDupeIssueBlockWrapper workspaceSlug={workspaceSlug} issue={issue} isSelected={isSelected}>
      <DeDupeIssueBlockHeader
        workspaceSlug={workspaceSlug}
        issue={issue}
        selectionHelpers={selectionHelpers}
        issueOperations={issueOperations}
        disabled={disabled}
        renderDeDupeActionModals={renderDeDupeActionModals}
        isIntakeIssue={isIntakeIssue}
      />
      <DeDupeIssueBlockContent issue={issue} />
    </DeDupeIssueBlockWrapper>
  );
};
