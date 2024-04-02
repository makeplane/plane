export interface IGanttBlock {
  data: any;
  id: string;
  position?: {
    marginLeft: number;
    width: number;
  };
  sort_order: number;
  start_date: Date | undefined;
  target_date: Date | undefined;
}

export interface IBlockUpdateData {
  sort_order?: {
    destinationIndex: number;
    newSortOrder: number;
    sourceIndex: number;
  };
  start_date?: string;
  target_date?: string;
}

export type TGanttViews = "hours" | "day" | "week" | "bi_week" | "month" | "quarter" | "year";

// chart render types
export interface WeekMonthDataType {
  key: number;
  shortTitle: string;
  title: string;
}

export interface ChartDataType {
  key: string;
  title: string;
  data: ChartDataTypeData;
}

export interface ChartDataTypeData {
  startDate: Date;
  currentDate: Date;
  endDate: Date;
  approxFilterRange: number;
  width: number;
}
