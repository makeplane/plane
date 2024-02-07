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
  start_date: Date | null;
  target_date: Date | null;
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

export interface ChartContextData {
  allViews: allViewsType[];
  currentView: TGanttViews;
  currentViewData: ChartDataType | undefined;
  renderView: any;
  activeBlock: IGanttBlock | null;
}

export type ChartContextActionPayload =
  | {
      type: "CURRENT_VIEW";
      payload: TGanttViews;
    }
  | {
      type: "CURRENT_VIEW_DATA" | "RENDER_VIEW";
      payload: ChartDataType | undefined;
    }
  | {
      type: "PARTIAL_UPDATE";
      payload: Partial<ChartContextData>;
    };

export interface ChartContextReducer extends ChartContextData {
  scrollLeft: number;
  updateScrollLeft: (scrollLeft: number) => void;
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
