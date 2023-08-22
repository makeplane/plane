// context types
export type allViewsType = {
  key: string;
  title: string;
  data: Object | null;
};

export interface IGanttBlock {
  data: any;
  id: string;
  position?: {
    marginLeft: number;
    width: number;
  };
  sort_order: number;
  start_date: Date;
  target_date: Date;
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

export interface ChartContextData {
  allViews: allViewsType[];
  currentView: "hours" | "day" | "week" | "bi_week" | "month" | "quarter" | "year";
  currentViewData: ChartDataType | undefined;
  renderView: any;
}

export type ChartContextActionPayload = {
  type: "CURRENT_VIEW" | "CURRENT_VIEW_DATA" | "PARTIAL_UPDATE" | "RENDER_VIEW";
  payload: any;
};

export interface ChartContextReducer extends ChartContextData {
  dispatch: (action: ChartContextActionPayload) => void;
}

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
