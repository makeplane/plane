import React from "react";
import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import CyclesInsightTable from "./cycles-insight-table";
import CyclesDistribution from "./cycles-distribution";

export function Cycles() {
    return (
        <AnalyticsWrapper i18nTitle="sidebar.cycles">
            <div className="flex flex-col gap-14">
                <TotalInsights analyticsType="cycles" />
                <CyclesDistribution />
                <CyclesInsightTable />
            </div>
        </AnalyticsWrapper>
    );
}
