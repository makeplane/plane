import React from "react";
import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import IntakeInsightTable from "./intake-insight-table";
import IntakeDistribution from "./intake-distribution";

export function Intake() {
    return (
        <AnalyticsWrapper i18nTitle="sidebar.intake">
            <div className="flex flex-col gap-14">
                <TotalInsights analyticsType="intake" />
                <IntakeDistribution />
                <IntakeInsightTable />
            </div>
        </AnalyticsWrapper>
    );
}
