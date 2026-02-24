import React from "react";
import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import ModulesInsightTable from "./modules-insight-table";
import ModulesDistribution from "./modules-distribution";

export function Modules() {
    return (
        <AnalyticsWrapper i18nTitle="sidebar.modules">
            <div className="flex flex-col gap-14">
                <TotalInsights analyticsType="modules" />
                <ModulesDistribution />
                <ModulesInsightTable />
            </div>
        </AnalyticsWrapper>
    );
}
