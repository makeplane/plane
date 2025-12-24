import type { FC } from "react";
// plane types
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";

export type TWorkItemAdditionalWidgetModalsProps = {
  hideWidgets: TWorkItemWidgets[];
  issueServiceType: TIssueServiceType;
  projectId: string;
  workItemId: string;
  workspaceSlug: string;
};

export function WorkItemAdditionalWidgetModals(_props: TWorkItemAdditionalWidgetModalsProps) {
  return null;
}
