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
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
// plane imports
import type { ICustomSearchSelectOption } from "@plane/types";
import { BreadcrumbNavigationSearchDropdown, Breadcrumbs } from "@plane/ui";
import { SwitcherLabel } from "@/components/common/switcher-label";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import type { TProject } from "@/types";

type TProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectBreadcrumb = observer(function ProjectBreadcrumb(props: TProjectBreadcrumbProps) {
  const { workspaceSlug, projectId } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const currentProjectDetails = getPartialProjectById(projectId);

  // store hooks

  if (!currentProjectDetails) return null;

  // derived values
  const switcherOptions = joinedProjectIds
    .map((projectId) => {
      const project = getPartialProjectById(projectId);
      return {
        value: projectId,
        query: project?.name,
        content: (
          <SwitcherLabel
            name={project?.name}
            logo_props={project?.logo_props}
            LabelIcon={ProjectIcon}
            type="material"
          />
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  // helpers
  const renderIcon = (projectDetails: TProject) => (
    <span className="grid place-items-center flex-shrink-0 size-4">
      <Logo logo={projectDetails.logo_props} size={14} />
    </span>
  );

  return (
    <>
      <Breadcrumbs.Item
        component={
          <BreadcrumbNavigationSearchDropdown
            selectedItem={currentProjectDetails.id}
            navigationItems={switcherOptions}
            onChange={(value: string) => {
              router.push(`/${workspaceSlug}/projects/${value}/issues`);
            }}
            title={currentProjectDetails?.name}
            icon={renderIcon(currentProjectDetails)}
            handleOnClick={() => router.push(`/${workspaceSlug}/projects/${currentProjectDetails.id}/issues/`)}
            shouldTruncate
          />
        }
        showSeparator={false}
      />
    </>
  );
});
