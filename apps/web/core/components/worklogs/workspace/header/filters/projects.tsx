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
import { CustomSearchSelect } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogFilterProjects = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogFilterProjects = observer(function WorkspaceWorklogFilterProjects(
  props: TWorkspaceWorklogFilterProjects
) {
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
          <span className="text-[0.65rem] text-secondary flex-shrink-0">{projectDetails?.identifier}</span>
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
