"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// types
import { TStateAnalytics } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store";
// plane web
import { ProgressSection } from "@/plane-web/components/common/layout/main/sections/progress-root";
import projectService from "@/plane-web/services/project/project.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewProgressSectionRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId);

  const { data: analytics } = useSWR(
    project && workspaceSlug ? `PROJECT_ANALYTICS_${project?.id}` : null,
    project && workspaceSlug ? () => projectService.fetchProjectAnalytics(workspaceSlug, project?.id) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (!analytics) return null;
  return <ProgressSection data={analytics as TStateAnalytics} title="Progress" />;
});
