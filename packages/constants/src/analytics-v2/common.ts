import { TAnalyticsTabsV2Base } from "@plane/types";

export const insightsFields: Record<TAnalyticsTabsV2Base, string[]> = {
    "overview": ["total_users", "total_admins", "total_members", "total_guests", "total_projects", "total_work_items", "total_cycles", "total_intake"],
    "work-items": ["total_work_items", "started_work_items", "backlog_work_items", "un_started_work_items", "completed_work_items"],
}

