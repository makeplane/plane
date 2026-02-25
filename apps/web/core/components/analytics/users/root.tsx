import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import UsersInsightTable from "./users-insight-table";
import UsersDistribution from "./users-distribution";

export function Users() {
    return (
        <AnalyticsWrapper i18nTitle="sidebar.users">
            <div className="flex flex-col gap-14">
                <TotalInsights analyticsType="users" />
                <UsersDistribution />
                <UsersInsightTable />
            </div>
        </AnalyticsWrapper>
    );
}
