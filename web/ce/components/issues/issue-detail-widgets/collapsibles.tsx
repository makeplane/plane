import { FC } from "react";
// plane types
import { TIssueServiceType } from "@plane/types";
// local imports
import { TWorkItemWidgets } from ".";

export type TWorkItemAdditionalWidgetCollapsiblesProps = {
  disabled: boolean;
  hideWidgets: TWorkItemWidgets[];
  issueServiceType: TIssueServiceType;
  projectId: string;
  workItemId: string;
  workspaceSlug: string;
};

export const WorkItemAdditionalWidgetCollapsibles: FC<TWorkItemAdditionalWidgetCollapsiblesProps> = () => null;
