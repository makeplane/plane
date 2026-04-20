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

import { useCallback, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// plane imports
import { IconButton } from "@plane/propel/icon-button";
import { ProjectIcon } from "@plane/propel/icons";
import type { ICustomSearchSelectOption } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useProject } from "@/hooks/store/use-project";
// components
import { SwitcherLabel } from "@/components/common/switcher-label";
import { ProjectSettingsSwitcherButton } from "./project-switcher-button";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  projectId: string;
  workspaceSlug: string;
};

export const ProjectSettingsSidebarHeader = observer(function ProjectSettingsSidebarHeader(props: Props) {
  const { projectId, workspaceSlug } = props;
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  // store hooks
  const { getCurrentUserProjectRoleSlug } = usePermissionAccess();
  const { getProjectRoleDetailsByRoleSlug } = useRoleManagement();
  const { getPartialProjectById, joinedProjectIds } = useProject();
  // derived values
  const projectDetails = getPartialProjectById(projectId);
  const currentProjectRoleSlug = getCurrentUserProjectRoleSlug(projectId);
  const roleDetails = currentProjectRoleSlug
    ? getProjectRoleDetailsByRoleSlug(workspaceSlug, currentProjectRoleSlug)
    : undefined;
  // translation

  // utility function to extract current section from pathname
  const extractSettingsSection = (pathname: string, workspaceSlug: string, projectId: string): string => {
    const pattern = new RegExp(`/${workspaceSlug}/settings/projects/${projectId}/(.+?)/?$`);
    const match = pathname.match(pattern);
    return match ? match[1] : ""; // Empty = general settings
  };

  // memoized options for project switcher
  const switcherOptions = useMemo<ICustomSearchSelectOption[]>(
    () =>
      joinedProjectIds.flatMap((id) => {
        const project = getPartialProjectById(id);
        if (!project) return [];

        return [
          {
            value: id,
            query: project.name,
            content: (
              <SwitcherLabel
                name={project.name}
                logo_props={project.logo_props}
                LabelIcon={ProjectIcon}
                type="material"
              />
            ),
          },
        ];
      }),
    [joinedProjectIds, getPartialProjectById]
  );

  // navigation handler to preserve current section
  const handleProjectChange = useCallback(
    (value: string) => {
      if (value !== projectId) {
        const currentSection = extractSettingsSection(pathname, workspaceSlug, projectId);
        const targetUrl = `/${workspaceSlug}/settings/projects/${value}/${currentSection}${currentSection ? "/" : ""}`;
        router.push(targetUrl);
      }
    },
    [projectId, pathname, workspaceSlug, router]
  );

  return (
    <div className="sticky top-0 shrink-0 bg-surface-1 pb-1.5">
      <div className="py-3 pl-4 pr-5 flex items-center gap-1 text-body-md-medium">
        <IconButton
          variant="ghost"
          size="base"
          icon={ArrowLeft}
          onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/`)}
        />
        <p>Project settings</p>
      </div>
      <div className="mt-1.5 px-5">
        <CustomSearchSelect
          options={switcherOptions}
          value={projectDetails?.id}
          onChange={handleProjectChange}
          customButton={
            projectDetails ? <ProjectSettingsSwitcherButton project={projectDetails} roleDetails={roleDetails} /> : null
          }
          customButtonClassName="group flex items-center gap-2 py-0.5 rounded hover:bg-surface-2 transition-colors cursor-pointer"
          optionsClassName="max-w-52"
          placement="bottom-start"
        />
      </div>
    </div>
  );
});
