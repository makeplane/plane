import { TBarItem } from "./charts";
import { TYAxisValues, TXAxisValues } from "@plane/types";

export type TAnalyticsTabsV2Base = "overview" | "work-items"
export type TAnalyticsGraphsV2Base = "projects" | "work-items" | "custom-work-items"


// service types

export interface IAnalyticsResponseV2 {
    [key: string]: any;
}

export interface IAnalyticsResponseFieldsV2 {
    count: number;
    filter_count: number;
}

export interface IAnalyticsRadarEntityV2 {
    key: string,
    name: string,
    count: number
}

// chart types

export interface IChartResponseV2 {
    schema: Record<string, string>;
    data: TChartData<string, string>[];
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

export interface IAnalyticsV2Params {
    x_axis: TXAxisValues;
    y_axis: TYAxisValues;
    group_by?: TXAxisValues;
}