import React from "react";
import AnalyticsWrapper from "@/components/analytics/analytics-wrapper";
import TotalInsights from "@/components/analytics/total-insights";
import CycleProgress from "./cycle-progress";
import CyclesInsightTable from "./cycles-insight-table";

const Cycles = () => (
  <AnalyticsWrapper i18nTitle="common.cycle">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="cycles" />
      <CycleProgress />
      <CyclesInsightTable />
    </div>
  </AnalyticsWrapper>
);

export { Cycles };
