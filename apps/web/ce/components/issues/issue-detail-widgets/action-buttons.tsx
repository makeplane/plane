import type { FC } from "react";
// plane types
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";

export type TWorkItemAdditionalWidgetActionButtonsProps = {
  disabled: boolean;
  hideWidgets: TWorkItemWidgets[];
  issueServiceType: TIssueServiceType;
  projectId: string;
  workItemId: string;
  workspaceSlug: string;
};

export const WorkItemAdditionalWidgetActionButtons: FC<TWorkItemAdditionalWidgetActionButtonsProps> = () => null;
