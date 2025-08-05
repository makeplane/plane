import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useLabel } from "@/hooks/store";
// local imports
import { TWorkItemLabelSelectBaseProps, WorkItemLabelSelectBase } from "./base";

type TWorkItemLabelSelectProps = Omit<TWorkItemLabelSelectBaseProps, "labelIds" | "getLabelById" | "onDropdownOpen"> & {
  projectId: string | undefined;
};

export const IssueLabelSelect: React.FC<TWorkItemLabelSelectProps> = observer((props) => {
  const { projectId } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectLabelIds, getLabelById, fetchProjectLabels } = useLabel();
  // derived values
  const projectLabelIds = getProjectLabelIds(projectId);

  const onDropdownOpen = () => {
    if (projectLabelIds === undefined && workspaceSlug && projectId)
      fetchProjectLabels(workspaceSlug.toString(), projectId);
  };

  return (
    <WorkItemLabelSelectBase
      {...props}
      getLabelById={getLabelById}
      labelIds={projectLabelIds ?? []}
      onDropdownOpen={onDropdownOpen}
    />
  );
});
