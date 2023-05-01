// context types
export type allViewsType = {
  key: string;
  title: string;
  data: Object | null;
};

export type ChartActionContextType = {
  type: "CHART_VIEW" | "CHART_VIEW_DATA";
  payload: any;
};

export type ChartContextType = {
  allViews: allViewsType[];
  currentView: "hours" | "day" | "week" | "bi_week" | "month" | "quarter" | "year";
  viewData: any;
  dispatch: (action: ChartActionContextType) => void;
};
