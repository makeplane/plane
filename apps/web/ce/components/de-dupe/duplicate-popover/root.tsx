import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
// types
import type { TDeDupeIssue } from "@plane/types";
import type { TIssueOperations } from "@/components/issues/issue-detail";

type TDeDupeIssuePopoverRootProps = {
  workspaceSlug: string;
  projectId: string;
  rootIssueId: string;
  issues: TDeDupeIssue[];
  issueOperations: TIssueOperations;
  disabled?: boolean;
  renderDeDupeActionModals?: boolean;
  isIntakeIssue?: boolean;
};

export const DeDupeIssuePopoverRoot = observer(function DeDupeIssuePopoverRoot(props: TDeDupeIssuePopoverRootProps) {
  const {} = props;
  return <></>;
});
