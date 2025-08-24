import React from "react";
import AnalyticsWrapper from "@/components/analytics/analytics-wrapper";
import TotalInsights from "@/components/analytics/total-insights";
import ProjectsByStatus from "./projects-by-status";
import ProjectsInsightTable from "./projects-insight-table";

const Projects: React.FC = () => (
  <AnalyticsWrapper i18nTitle="common.project">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="projects" />
      <ProjectsByStatus />
      <ProjectsInsightTable />
    </div>
  </AnalyticsWrapper>
);

export { Projects };
