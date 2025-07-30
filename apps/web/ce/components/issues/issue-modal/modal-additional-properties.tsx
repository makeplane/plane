import React from "react";

export type TWorkItemModalAdditionalPropertiesProps = {
  isDraft?: boolean;
  projectId: string | null;
  workItemId: string | undefined;
  workspaceSlug: string;
};

export const WorkItemModalAdditionalProperties: React.FC<TWorkItemModalAdditionalPropertiesProps> = () => null;
