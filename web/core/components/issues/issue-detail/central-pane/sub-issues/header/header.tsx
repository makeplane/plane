"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Layers } from "lucide-react";
// components
import { SubIssuesActionButton, CentralPaneHeaderActionButton } from "@/components/issues/issue-detail/central-pane";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const SubIssuesHeader: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;

  return (
    <SubIssuesActionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      parentIssueId={issueId}
      disabled={disabled}
      customButton={
        <CentralPaneHeaderActionButton
          title="Add sub-issues"
          icon={<Layers className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" strokeWidth={2} />}
        />
      }
    />
  );
});
