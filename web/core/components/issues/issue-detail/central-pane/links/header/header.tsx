"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Link } from "lucide-react";
// components
import { CentralPaneHeaderActionButton, IssueLinksActionButton } from "@/components/issues/issue-detail/central-pane";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const LinksHeader: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;

  return (
    <IssueLinksActionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={disabled}
      customButton={
        <CentralPaneHeaderActionButton
          title="Add Links"
          icon={<Link className="h-3.5 w-3.5 flex-shrink-0 text-lg text-custom-text-300" />}
        />
      }
    />
  );
});
