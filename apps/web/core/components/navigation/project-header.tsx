"use client";

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane ui imports
import type { ICustomSearchSelectOption } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
// plane propel imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useNavigationItems } from "@/plane-web/components/navigations";
// local components
import { SwitcherLabel } from "../common/switcher-label";
// utils
import { getTabUrl } from "./tab-navigation-utils";
import { useTabPreferences } from "./use-tab-preferences";

type TProjectHeaderProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectHeader = observer((props: TProjectHeaderProps) => {
  const { workspaceSlug, projectId } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();

  // Get current project details
  const currentProjectDetails = getPartialProjectById(projectId);

  // Get available navigation items for this project
  const navigationItems = useNavigationItems({
    workspaceSlug: workspaceSlug.toString(),
    projectId,
    project: currentProjectDetails,
    allowPermissions,
  });

  // Get preferences from hook
  const { tabPreferences } = useTabPreferences(workspaceSlug.toString(), projectId);

  // Memoize available tab keys
  const availableTabKeys = useMemo(() => navigationItems.map((item) => item.key), [navigationItems]);

  // Memoize validated default tab key
  const validatedDefaultTabKey = useMemo(
    () =>
      availableTabKeys.includes(tabPreferences.defaultTab)
        ? tabPreferences.defaultTab
        : availableTabKeys[0] || "work_items",
    [availableTabKeys, tabPreferences.defaultTab]
  );

  // Memoize switcher options to prevent recalculation on every render
  const switcherOptions = useMemo<ICustomSearchSelectOption[]>(
    () =>
      joinedProjectIds
        .map((id): ICustomSearchSelectOption | null => {
          const project = getPartialProjectById(id);
          if (!project) return null;

          return {
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
          };
        })
        .filter((option): option is ICustomSearchSelectOption => option !== null),
    [joinedProjectIds, getPartialProjectById]
  );

  // Memoize the custom button to prevent re-renders
  const customButton = useMemo(
    () =>
      currentProjectDetails ? (
        <Tooltip tooltipContent={currentProjectDetails.name} position="bottom">
          <div className="flex items-center gap-1.5 text-left select-none w-full">
            <div className="size-7 rounded-md bg-custom-background-90 flex items-center justify-center flex-shrink-0">
              <Logo logo={currentProjectDetails.logo_props} size={16} />
            </div>
            <p className="truncate text-base font-medium text-custom-sidebar-text-200 flex-shrink-0 pr-2.5 max-w-48">
              {currentProjectDetails.name}
            </p>
          </div>
        </Tooltip>
      ) : null,
    [currentProjectDetails]
  );

  // Memoize onChange handler
  const handleProjectChange = useCallback(
    (value: string) => {
      if (value !== currentProjectDetails?.id) {
        router.push(getTabUrl(workspaceSlug.toString(), value, validatedDefaultTabKey));
      }
    },
    [currentProjectDetails?.id, router, workspaceSlug, validatedDefaultTabKey]
  );

  // Early return if no project details
  if (!currentProjectDetails) return null;

  return (
    <CustomSearchSelect
      options={switcherOptions}
      value={currentProjectDetails.id}
      onChange={handleProjectChange}
      customButton={customButton}
      className="h-full rounded"
      customButtonClassName="group flex items-center gap-0.5 rounded hover:bg-custom-background-90 outline-none cursor-pointer h-full rounded p-1"
    />
  );
});
