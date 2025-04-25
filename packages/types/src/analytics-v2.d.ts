
export type TAnalyticsTabsV2Base = "overview" | "work-items"


// service types

export interface IAnalyticsResponseV2 {
    [key: string]: any;
}

export interface IAnalyticsResponseFieldsV2 {
    count: number;
    filter_count: number;
}

// table types

export interface WorkItemInsightColumns {
    project_id: string;
    project__name: string;
    cancelled_work_items: number;
    completed_work_items: number;
    backlog_work_items: number;
    un_started_work_items: number;
    started_work_items: number;
}

type AnalyticsTableDataMap = {
    "work-items": WorkItemInsightColumns,
}


