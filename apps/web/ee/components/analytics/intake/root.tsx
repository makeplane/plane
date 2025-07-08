import React from "react";
import AnalyticsWrapper from "@/components/analytics/analytics-wrapper";
import TotalInsights from "@/components/analytics/total-insights";
import IntakeInsightTable from "./intake-insight-table";
import IntakeTrends from "./intake-trends";

const Intake = () => (
  <AnalyticsWrapper i18nTitle="intake">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="intake" />
      <IntakeTrends />
      <IntakeInsightTable />
    </div>
  </AnalyticsWrapper>
);

export { Intake };
