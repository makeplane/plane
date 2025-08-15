"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { AppliedFilterGroup, AppliedFilterGroupItem } from "@/plane-web/components/worklogs";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogAppliedFilterProjects = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogAppliedFilterProjects: FC<TWorkspaceWorklogAppliedFilterProjects> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { getProjectById } = useProject();
  const { filters, updateFilters } = useWorkspaceWorklogs();

  // derived values
  const selectedIds = filters.project;

  if (selectedIds.length <= 0) return <></>;

  const handleSelectedOptions = (userSelectId: string | "clear" | undefined) => {
    if (!userSelectId) return;
    updateFilters(
      workspaceSlug,
      "project",
      userSelectId === "clear" ? [] : selectedIds.filter((id) => id !== userSelectId)
    );
  };

  const appliedFiltersData = selectedIds?.map((projectId) => {
    const projectDetails = getProjectById(projectId);
    return {
      value: projectDetails?.id,
      onClick: selectedIds.length === 1 ? undefined : () => handleSelectedOptions(projectDetails?.id),
      content: (
        <div className="flex items-center gap-1">
          <div className="text-[0.65rem] text-custom-text-200 flex-shrink-0">{projectDetails?.identifier}</div>
          <div className="flex-grow truncate text-xs">{projectDetails?.name}</div>
        </div>
      ),
    };
  });

  return (
    <AppliedFilterGroup groupTitle="Projects" onClear={() => handleSelectedOptions("clear")}>
      {appliedFiltersData.map((item) => (
        <AppliedFilterGroupItem key={item.value} onClear={item.onClick}>
          {item.content}
        </AppliedFilterGroupItem>
      ))}
    </AppliedFilterGroup>
  );
});
