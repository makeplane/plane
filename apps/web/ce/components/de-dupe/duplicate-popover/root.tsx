"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// types
import { TDeDupeIssue } from "@plane/types";
import { TIssueOperations } from "@/components/issues";

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

export const DeDupeIssuePopoverRoot: FC<TDeDupeIssuePopoverRootProps> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    rootIssueId,
    issues,
    issueOperations,
    disabled = false,
    renderDeDupeActionModals = true,
    isIntakeIssue = false,
  } = props;
  return <></>;
});
