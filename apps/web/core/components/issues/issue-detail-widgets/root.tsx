"use client";

import type { FC } from "react";
import React from "react";
// plane imports
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// local imports
import { IssueDetailWidgetActionButtons } from "./action-buttons";
import { IssueDetailWidgetCollapsibles } from "./issue-detail-widget-collapsibles";
import { IssueDetailWidgetModals } from "./issue-detail-widget-modals";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  renderWidgetModals?: boolean;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
};

export const IssueDetailWidgets: FC<Props> = (props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    disabled,
    renderWidgetModals = true,
    issueServiceType,
    hideWidgets,
  } = props;

  return (
    <>
      <div className="flex flex-col gap-5">
        <IssueDetailWidgetActionButtons
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
          hideWidgets={hideWidgets}
        />
        <IssueDetailWidgetCollapsibles
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
          hideWidgets={hideWidgets}
        />
      </div>
      {renderWidgetModals && (
        <IssueDetailWidgetModals
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueServiceType={issueServiceType}
          hideWidgets={hideWidgets}
        />
      )}
    </>
  );
};
