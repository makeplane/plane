import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// plane web hooks
import { useAnalytics, useProject } from "@/hooks/store";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import ActiveProjectItem from "./active-project-item";

const ActiveProjects = observer(() => {
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
      <div className="flex flex-col gap-4 h-[350px] overflow-auto">
        {isProjectAnalyticsCountLoading &&
          Array.from({ length: 5 }).map((_, index) => <Loader.Item key={index} height="40px" width="100%" />)}
        {!isProjectAnalyticsCountLoading &&
          projectAnalyticsCount?.map((project) => <ActiveProjectItem key={project.id} project={project} />)}
      </div>
    </AnalyticsSectionWrapper>
  );
});

export default ActiveProjects;
