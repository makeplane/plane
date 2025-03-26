import { FC } from "react";

export type TWorkItemAdditionalWidgets = {
  workspaceSlug: string;
  projectId: string;
  workItemId: string;
  disabled: boolean;
};

export const WorkItemAdditionalWidgets: FC<TWorkItemAdditionalWidgets> = (props) => <></>;
