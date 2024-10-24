"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
// plane web components
import { usePathname, useSearchParams } from "next/navigation";
import { useProject } from "@/hooks/store";
import { ProjectLayoutRoot } from "@/plane-web/components/projects";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectFilters, EProjectScope } from "@/plane-web/types/workspace-project-filters";

type TWorkspaceProjectsRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceProjectsRoot: FC<TWorkspaceProjectsRoot> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { initWorkspaceFilters } = useProjectFilter();
  const searchParams = useSearchParams();
  const showAllProjects = searchParams.get("show-all-projects");
  const pathname = usePathname();
  const { loader } = useProject();

  useEffect(() => {
    if (workspaceSlug) {
      let filtersToInit = [EProjectFilters.LAYOUT, EProjectFilters.ATTRIBUTES, EProjectFilters.DISPLAY_FILTERS];
      filtersToInit = loader ? filtersToInit : [EProjectFilters.SCOPE, ...filtersToInit];
      initWorkspaceFilters(
        workspaceSlug,
        typeof showAllProjects === "string"
          ? showAllProjects === "true"
            ? EProjectScope.ALL_PROJECTS
            : EProjectScope.MY_PROJECTS
          : undefined,
        filtersToInit
      );
    }
  }, [workspaceSlug, initWorkspaceFilters, pathname, showAllProjects, loader]);

  return <ProjectLayoutRoot />;
});
