"use client";

import { observer } from "mobx-react";
// types
import { TDeDupeIssue } from "@plane/types";
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

export const DeDupeIssuePopoverRoot: React.FC<TDeDupeIssuePopoverRootProps> = observer(() => <></>);
