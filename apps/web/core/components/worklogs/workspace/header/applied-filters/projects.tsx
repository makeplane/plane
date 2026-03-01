/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { AppliedFilterGroup, AppliedFilterGroupItem } from "@/components/worklogs";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogAppliedFilterProjects = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogAppliedFilterProjects = observer(function WorkspaceWorklogAppliedFilterProjects(
  props: TWorkspaceWorklogAppliedFilterProjects
) {
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
          <div className="text-[0.65rem] text-secondary flex-shrink-0">{projectDetails?.identifier}</div>
          <div className="flex-grow truncate text-11">{projectDetails?.name}</div>
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
