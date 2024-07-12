"use client";
import React, { FC } from "react";
// components
import {
  IssueDetailWidgetActionButtons,
  IssueDetailWidgetCollapsibles,
  IssueDetailWidgetModals,
} from "@/components/issues/issue-detail-widgets";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueDetailWidgets: FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  return (
    <>
      <div className="flex flex-col gap-5">
        <IssueDetailWidgetActionButtons
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
        <IssueDetailWidgetCollapsibles
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      </div>
      <IssueDetailWidgetModals workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
    </>
  );
};
