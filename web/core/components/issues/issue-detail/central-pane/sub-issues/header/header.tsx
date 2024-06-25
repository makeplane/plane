"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Layers } from "lucide-react";
// components
import { SubIssuesActionButton, CentralPaneHeaderActionButton } from "@/components/issues/issue-detail/central-pane";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
};

export const SubIssuesHeader: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, parentIssueId } = props;
  // store hooks
  const {
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail();

  const subIssues = subIssuesByIssueId(parentIssueId);

  return (
    <SubIssuesActionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      parentIssueId={parentIssueId}
      customButton={
        <CentralPaneHeaderActionButton
          title="Sub-issues"
          icon={<Layers className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" strokeWidth={2} />}
          value={subIssues && subIssues.length > 0 ? `${subIssues.length}` : undefined}
        />
      }
    />
  );
});
