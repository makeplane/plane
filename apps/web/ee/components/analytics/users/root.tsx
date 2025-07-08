import React from "react";
import AnalyticsWrapper from "@/components/analytics/analytics-wrapper";
import TotalInsights from "@/components/analytics/total-insights";
import ActiveUsers from "./active-users";
import UsersInsightTable from "./user-insight-table";

const Users: React.FC = () => (
  <AnalyticsWrapper i18nTitle="common.user">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="users" />
      <ActiveUsers />
      <UsersInsightTable />
    </div>
  </AnalyticsWrapper>
);

export { Users };
