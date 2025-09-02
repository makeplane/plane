"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// types
import { TStateAnalytics } from "@plane/types";
// ui
import { LayersIcon } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web
import { SectionEmptyState } from "@/plane-web/components/common/layout/main/common/empty-state";
import { SectionWrapper } from "@/plane-web/components/common/layout/main/common/section-wrapper";
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

  const isEmpty = Object.values(analytics).every((value) => value === 0);

  if (isEmpty) {
    return (
      <SectionWrapper>
        <SectionEmptyState
          heading="No work items yet"
          subHeading="Start adding work items manage and track the progress."
          icon={<LayersIcon className="size-4" />}
        />
      </SectionWrapper>
    );
  }
  return <ProgressSection data={analytics as TStateAnalytics} />;
});
