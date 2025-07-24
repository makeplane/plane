import React from "react";
import AnalyticsWrapper from "@/components/analytics/analytics-wrapper";
import TotalInsights from "@/components/analytics/total-insights";
import ModulesInsightTable from "./module-insight-table";
import ModuleProgress from "./modules-progress";

const Modules = () => (
  <AnalyticsWrapper i18nTitle="common.module">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="modules" />
      <ModuleProgress />
      <ModulesInsightTable />
    </div>
  </AnalyticsWrapper>
);

export { Modules };
