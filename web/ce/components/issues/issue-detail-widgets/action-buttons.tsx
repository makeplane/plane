import { FC } from "react";
// plane types
import { TIssueServiceType } from "@plane/types";
// local imports
import { TWorkItemWidgets } from ".";

export type TWorkItemAdditionalWidgetActionButtonsProps = {
  disabled: boolean;
  hideWidgets: TWorkItemWidgets[];
  issueServiceType: TIssueServiceType;
  projectId: string;
  workItemId: string;
  workspaceSlug: string;
};

export const WorkItemAdditionalWidgetActionButtons: FC<TWorkItemAdditionalWidgetActionButtonsProps> = () => null;
