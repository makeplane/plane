/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
// plane web hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import ActiveProjectItem from "./active-project-item";

const ActiveProjects = observer(function ActiveProjects() {
  const { t } = useTranslation();
  const { fetchProjectAnalyticsCount } = useProject();
  const { workspaceSlug } = useParams();
  const { selectedDurationLabel } = useAnalytics();
  const { data: projectAnalyticsCount, isLoading: isProjectAnalyticsCountLoading } = useSWR(
    workspaceSlug ? ["projectAnalyticsCount", workspaceSlug] : null,
    workspaceSlug
      ? () =>
          fetchProjectAnalyticsCount(workspaceSlug.toString(), {
            fields: "total_work_items,total_completed_work_items",
          })
      : null
  );
  return (
    <AnalyticsSectionWrapper
      title={`${t("workspace_analytics.active_projects")}`}
      subtitle={selectedDurationLabel}
      className="md:col-span-2"
    >
      <div className="flex h-[350px] flex-col gap-4 overflow-auto">
        {isProjectAnalyticsCountLoading && (
          <Skeleton aria-label="Loading active projects">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonItem key={index} blockSize="40px" />
              ))}
            </div>
          </Skeleton>
        )}
        {!isProjectAnalyticsCountLoading &&
          projectAnalyticsCount?.map((project) => <ActiveProjectItem key={project.id} project={project} />)}
      </div>
    </AnalyticsSectionWrapper>
  );
});

export default ActiveProjects;
