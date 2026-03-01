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

import { lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
// assets
import projectsDark from "@/app/assets/empty-state/onboarding/projects-dark.webp?url";
import projectsLight from "@/app/assets/empty-state/onboarding/projects-light.webp?url";
import allFiltersDarkSvg from "@/app/assets/empty-state/project/all-filters-dark.svg?url";
import allFiltersLightSvg from "@/app/assets/empty-state/project/all-filters-light.svg?url";
// components
import { ComicBoxButton } from "@/components/empty-state/comic-box-button";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// types
import { EProjectLayouts } from "@/types/workspace-project-filters";

const ListLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/list-layout-loader").then((module) => ({
    default: module.ListLayoutLoader,
  }))
);
const KanbanLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/kanban-layout-loader").then((module) => ({
    default: module.KanbanLayoutLoader,
  }))
);
const ProjectsLoader = lazy(() =>
  import("@/components/ui/loader/projects-loader").then((module) => ({
    default: module.ProjectsLoader,
  }))
);
const TimelineLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/timeline-layout-loader").then((module) => ({
    default: module.TimelineLayoutLoader,
  }))
);

const PROJECT_LAYOUT_LOADERS: Record<EProjectLayouts, LazyExoticComponent<ComponentType>> = {
  [EProjectLayouts.TABLE]: ListLayoutLoader,
  [EProjectLayouts.BOARD]: KanbanLayoutLoader,
  [EProjectLayouts.GALLERY]: ProjectsLoader,
  [EProjectLayouts.TIMELINE]: TimelineLayoutLoader,
};

function ActiveLoader(props: { layout: EProjectLayouts }) {
  const { layout } = props;
  const ProjectLayoutLoaderComponent = PROJECT_LAYOUT_LOADERS[layout];
  if (!ProjectLayoutLoaderComponent) return <></>;
  return (
    <Suspense>
      <ProjectLayoutLoaderComponent />
    </Suspense>
  );
}

interface Props {
  children: string | React.ReactNode | React.ReactNode[];
  layout: EProjectLayouts;
}

export const ProjectLayoutHOC = observer(function ProjectLayoutHOC(props: Props) {
  const { layout } = props;
  // plane hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  // store hooks
  const { fetchStatus } = useProject();
  const { loading } = useProjectFilter();
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { projectStates } = useWorkspaceProjectStates();
  const { toggleCreateProjectModal } = useCommandPalette();
  // derived values
  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.GALLERY);
  const { allowPermissions } = useUserPermissions();
  // derived values
  const resolvedPath = resolvedTheme === "light" ? projectsLight : projectsDark;
  const resolvedFiltersImage = resolvedTheme === "light" ? allFiltersLightSvg : allFiltersDarkSvg;

  const hasProjectMemberPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (loading || isEmpty(projectStates) || fetchStatus !== "complete") {
    return <ActiveLoader layout={layout} />;
  }
  if (!filteredProjectIds) {
    return (
      <DetailedEmptyState
        title={t("workspace_projects.empty_state.general.title")}
        description={t("workspace_projects.empty_state.general.description")}
        assetPath={resolvedPath}
        customPrimaryButton={
          <ComicBoxButton
            label={t("workspace_projects.empty_state.general.primary_button.text")}
            title={t("workspace_projects.empty_state.general.primary_button.comic.title")}
            description={t("workspace_projects.empty_state.general.primary_button.comic.description")}
            onClick={() => {
              toggleCreateProjectModal(true);
            }}
            disabled={!hasProjectMemberPermissions}
          />
        }
      />
    );
  }
  if (filteredProjectIds.length === 0) {
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <img src={resolvedFiltersImage} className="mx-auto h-36 w-36 sm:h-48 sm:w-48" alt="No matching projects" />
          <h5 className="mb-1 mt-7 text-18 font-medium">No matching projects</h5>
          <p className="whitespace-pre-line text-14 text-placeholder">
            {`No projects detected with the matching\ncriteria. Create a new project instead`}
          </p>
        </div>
      </div>
    );
  }
  return <>{props.children}</>;
});
