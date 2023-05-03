// context types
export type allViewsType = {
  key: string;
  title: string;
  data: Object | null;
};

export type ChartActionContextType = {
  type: "CURRENT_VIEW" | "CURRENT_VIEW_DATA" | "PARTIAL_UPDATE";
  payload: any;
};

export type ChartContextType = {
  allViews: allViewsType[];
  currentView: "hours" | "day" | "week" | "bi_week" | "month" | "quarter" | "year";
  currentViewData: any;
  dispatch: (action: ChartActionContextType) => void;
};

// chart render types
export interface ChartDataType {
  key: string;
  title: string;
  data: ChartDataTypeData;
}

export interface ChartDataTypeData {
  previousDate: Date;
  currentDate: Date;
  nextDate: Date;
  approxRange: number;
  width: number;
}
