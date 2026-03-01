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

import { observer } from "mobx-react";
import { ChevronDownIcon } from "@plane/propel/icons";
// components
import { ProjectScopeDropdown } from "@/components/projects/dropdowns/scope";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useProjectFilter } from "@/plane-web/hooks/store";
// local imports
import { ProjectAttributesDropdown } from "./attributes-dropdown/root";
import { ProjectDisplayFiltersDropdown } from "./display-filters-dropdown/root";
import { ProjectLayoutSelection } from "./layout-selection";

type TProjectsListWithGroupingMobileHeaderProps = {
  workspaceSlug: string;
  isArchived: boolean;
};

const getCustomButton = (label: string) => (
  <div className="flex text-13 items-center gap-2 text-secondary">
    {label}
    <ChevronDownIcon className="h-3 w-3" strokeWidth={2} />
  </div>
);

export const ProjectsListWithGroupingMobileHeader = observer(function ProjectsListWithGroupingMobileHeader(
  props: TProjectsListWithGroupingMobileHeaderProps
) {
  const { workspaceSlug, isArchived } = props;
  // hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { filters } = useProjectFilter();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const workspaceId = currentWorkspace?.id || undefined;
  const selectedScope = filters?.scope;

  if (!workspaceId) return <></>;
  return (
    <div className="flex py-2 border-b border-subtle-1 md:hidden bg-surface-1 w-full">
      {!isArchived && (
        <div className="border-l border-subtle-1 flex justify-around w-full">
          <ProjectLayoutSelection workspaceSlug={workspaceSlug.toString()} />
        </div>
      )}
      {!isArchived && selectedScope && (
        <div className="border-l border-subtle-1 flex justify-around w-full">
          <ProjectScopeDropdown workspaceSlug={workspaceSlug.toString()} className={"border-none"} />
        </div>
      )}
      <div className="border-l border-subtle-1 flex justify-around w-full">
        <ProjectAttributesDropdown
          workspaceSlug={workspaceSlug.toString()}
          workspaceId={workspaceId}
          menuButton={getCustomButton("Filters")}
          isArchived={isArchived}
        />
      </div>
      <div className="border-l border-subtle-1 flex justify-around w-full">
        <ProjectDisplayFiltersDropdown
          workspaceSlug={workspaceSlug.toString()}
          menuButton={getCustomButton("Display")}
          isArchived={isArchived}
        />
      </div>
    </div>
  );
});
