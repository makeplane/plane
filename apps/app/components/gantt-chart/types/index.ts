// context types
export type allViewsType = {
  key: string;
  title: string;
  data: Object | null;
};

export type ChartActionContextType = {
  type: "BLOCK_SIDEBAR_TOGGLE" | "CURRENT_VIEW" | "CURRENT_VIEW_DATA" | "PARTIAL_UPDATE" | "RENDER_VIEW";
  payload: any;
};

export type ChartContextType = {
  blockSidebarToggle: boolean;
  allViews: allViewsType[];
  currentView: "hours" | "day" | "week" | "bi_week" | "month" | "quarter" | "year";
  currentViewData: any;
  renderView: any;
  dispatch: (action: ChartActionContextType) => void;
};

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
