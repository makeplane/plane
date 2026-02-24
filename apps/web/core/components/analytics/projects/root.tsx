import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import ProjectsInsightTable from "./projects-insight-table";
import ProjectDistribution from "./project-distribution";

export function Projects() {
    return (
        <AnalyticsWrapper i18nTitle="sidebar.projects">
            <div className="flex flex-col gap-14">
                <TotalInsights analyticsType="projects" />
                <ProjectDistribution />
                <ProjectsInsightTable />
            </div>
        </AnalyticsWrapper>
    );
}
