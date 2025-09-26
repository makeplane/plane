"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { CustomSearchSelect } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogFilterProjects = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogFilterProjects: FC<TWorkspaceWorklogFilterProjects> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { workspaceProjectIds, getProjectById } = useProject();
  const { filters, updateFilters } = useWorkspaceWorklogs();

  // derived values
  const selectedIds = filters.project;

  const dropdownLabel = () =>
    selectedIds.length === 1
      ? workspaceProjectIds
          ?.filter((p) => selectedIds.includes(p))
          .map((p) => getProjectById(p)?.name)
          .join(", ")
      : selectedIds.length > 1
        ? `${selectedIds?.length} Projects`
        : "Projects";

  const dropdownOptions = workspaceProjectIds?.map((projectId) => {
    const projectDetails = getProjectById(projectId);
    return {
      value: projectDetails?.id,
      query: `${projectDetails?.name} ${projectDetails?.identifier}`,
      content: (
        <div className="flex items-center gap-2 truncate max-w-[300px]">
          <span className="text-[0.65rem] text-custom-text-200 flex-shrink-0">{projectDetails?.identifier}</span>
          <span className="flex-grow truncate">{projectDetails?.name}</span>
        </div>
      ),
    };
  });

  const handleSelectedOptions = (updatedIds: string[]) => updateFilters(workspaceSlug, "project", updatedIds);

  return (
    <CustomSearchSelect
      value={selectedIds}
      onChange={handleSelectedOptions}
      options={dropdownOptions}
      label={dropdownLabel()}
      multiple
    />
  );
});
