"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
// plane web components
import { usePathname, useSearchParams } from "next/navigation";
import { ProjectLayoutRoot } from "@/plane-web/components/projects";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectScope } from "@/plane-web/types/workspace-project-filters";

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

  useEffect(() => {
    if (workspaceSlug)
      initWorkspaceFilters(
        workspaceSlug,
        typeof showAllProjects === "string"
          ? showAllProjects === "true"
            ? EProjectScope.ALL_PROJECTS
            : EProjectScope.MY_PROJECTS
          : undefined
      );
  }, [workspaceSlug, initWorkspaceFilters, pathname, showAllProjects]);

  return <ProjectLayoutRoot />;
});
