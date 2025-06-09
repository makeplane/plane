import React from "react";
import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import CreatedVsResolved from "./created-vs-resolved";
import CustomizedInsights from "./customized-insights";
import WorkItemsInsightTable from "./workitems-insight-table";

const WorkItems: React.FC = () => (
  <AnalyticsWrapper title="Work Items">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="work-items" />
      <CreatedVsResolved />
      <CustomizedInsights />
      <WorkItemsInsightTable />
    </div>
  </AnalyticsWrapper>
);

export { WorkItems };
