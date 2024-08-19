"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
// plane web components
import { ProjectLayoutRoot } from "@/plane-web/components/projects";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";

type TWorkspaceProjectsRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceProjectsRoot: FC<TWorkspaceProjectsRoot> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { initWorkspaceFilters } = useProjectFilter();

  useEffect(() => {
    if (workspaceSlug) initWorkspaceFilters(workspaceSlug);
  }, [workspaceSlug, initWorkspaceFilters]);

  return <ProjectLayoutRoot />;
});
