import { TAnalyticsTabsV2Base } from "@plane/types";

export const insightsFields: Record<TAnalyticsTabsV2Base, string[]> = {
    "overview": ["total_users", "total_admins", "total_members", "total_guests", "total_projects", "total_work_items", "total_cycles", "total_intake"],
    "work-items": ["total_work_items", "started_work_items", "backlog_work_items", "un_started_work_items", "completed_work_items"],
}


export const ANALYTICS_V2_DURATION_FILTER_OPTIONS = [
    {
        name: "Yesterday",
        value: "yesterday",
    },
    {
        name: "Last 7 days",
        value: "last_7_days",
    },
    {
        name: "Last 30 days",
        value: "last_30_days",
    },
    {
        name: "Last 3 months",
        value: "last_3_months",
    }
];
