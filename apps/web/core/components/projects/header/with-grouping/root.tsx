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
import { ProjectIcon } from "@plane/propel/icons";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ProjectScopeDropdown } from "@/components/projects/dropdowns/scope";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { ProjectAttributesDropdown } from "./attributes-dropdown";
import { ProjectCreateButton } from "./create-project-button";
import { ProjectDisplayFiltersDropdown } from "./display-filters-dropdown";
import { ProjectLayoutSelection } from "./layout-selection";
import { ProjectSearch } from "./search-projects";

type TProjectsListWithGroupingHeaderProps = {
  workspaceSlug: string;
  isArchived: boolean;
};

export const ProjectsListWithGroupingHeader = observer(function ProjectsListWithGroupingHeader(
  props: TProjectsListWithGroupingHeaderProps
) {
  const { workspaceSlug, isArchived } = props;
  // hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const workspaceId = currentWorkspace?.id || undefined;

  if (!workspaceId) return <></>;
  return (
    <div className="flex-shrink-0 relative z-10 flex h-header w-full">
      {/* flex-row items-center justify-between gap-x-2 gap-y-4 */}
      <div className="w-full h-full relative flex justify-between items-center gap-x-2 gap-y-4">
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={<BreadcrumbLink label="Projects" icon={<ProjectIcon className="h-4 w-4 text-tertiary" />} />}
            />
            {isArchived && <Breadcrumbs.Item component={<BreadcrumbLink label="Archived" />} />}
          </Breadcrumbs>
          {/* scope dropdown */}
          {!isArchived && (
            <div className="hidden md:flex gap-4">
              <ProjectScopeDropdown workspaceSlug={workspaceSlug.toString()} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* search */}
          <ProjectSearch />
          <div className="hidden md:flex gap-2">
            {/* layout selection */}
            {!isArchived && <ProjectLayoutSelection workspaceSlug={workspaceSlug.toString()} />}{" "}
            {/* attributes dropdown */}
            <ProjectAttributesDropdown
              workspaceSlug={workspaceSlug.toString()}
              workspaceId={workspaceId}
              isArchived={isArchived}
            />
            {/* display filters dropdown */}
            <ProjectDisplayFiltersDropdown workspaceSlug={workspaceSlug.toString()} isArchived={isArchived} />
          </div>
          {/* create project button */}
          {!isArchived && <ProjectCreateButton />}
        </div>
      </div>
    </div>
  );
});
