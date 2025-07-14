export enum EWidgetChartModels {
  BASIC = "BASIC",
  STACKED = "STACKED",
  GROUPED = "GROUPED",
  MULTI_LINE = "MULTI_LINE",
  COMPARISON = "COMPARISON",
  PROGRESS = "PROGRESS",
}

export enum EWidgetChartTypes {
  BAR_CHART = "BAR_CHART",
  LINE_CHART = "LINE_CHART",
  AREA_CHART = "AREA_CHART",
  PIE_CHART = "PIE_CHART",
  DONUT_CHART = "DONUT_CHART",
  NUMBER = "NUMBER",
}

export enum EWidgetXAxisDateGrouping {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export enum EWidgetXAxisProperty {
  STATES = "STATES",
  STATE_GROUPS = "STATE_GROUPS",
  LABELS = "LABELS",
  ASSIGNEES = "ASSIGNEES",
  ESTIMATE_POINTS = "ESTIMATE_POINTS",
  CYCLES = "CYCLES",
  MODULES = "MODULES",
  PRIORITY = "PRIORITY",
  START_DATE = "START_DATE",
  TARGET_DATE = "TARGET_DATE",
  CREATED_AT = "CREATED_AT",
  COMPLETED_AT = "COMPLETED_AT",
  CREATED_BY = "CREATED_BY",
  WORK_ITEM_TYPES = "WORK_ITEM_TYPES",
  PROJECTS = "PROJECTS",
  EPICS = "EPICS",
}

export enum EWidgetYAxisMetric {
  WORK_ITEM_COUNT = "WORK_ITEM_COUNT",
  ESTIMATE_POINT_COUNT = "ESTIMATE_POINT_COUNT",
  PENDING_WORK_ITEM_COUNT = "PENDING_WORK_ITEM_COUNT",
  COMPLETED_WORK_ITEM_COUNT = "COMPLETED_WORK_ITEM_COUNT",
  IN_PROGRESS_WORK_ITEM_COUNT = "IN_PROGRESS_WORK_ITEM_COUNT",
  WORK_ITEM_DUE_THIS_WEEK_COUNT = "WORK_ITEM_DUE_THIS_WEEK_COUNT",
  WORK_ITEM_DUE_TODAY_COUNT = "WORK_ITEM_DUE_TODAY_COUNT",
  BLOCKED_WORK_ITEM_COUNT = "BLOCKED_WORK_ITEM_COUNT",
}

export type TWidgetChartColorScheme = "modern" | "horizon" | "earthen";
export type TWidgetBarChartOrientation = "vertical" | "horizontal";
export type TWidgetLineChartLineType = "solid" | "dashed";
export type TWidgetTextAlignment = "left" | "center" | "right";
export type TWidgetPieChartValuesType = "percentage" | "count";
// bar chart
export type TBarChartWidgetConfig = {
  bar_color?: string;
  color_scheme?: TWidgetChartColorScheme;
  orientation?: TWidgetBarChartOrientation;
  show_legends?: boolean;
  show_tooltip?: boolean;
};
// line chart
export type TLineChartWidgetConfig = {
  color_scheme?: TWidgetChartColorScheme;
  line_color?: string;
  line_type?: TWidgetLineChartLineType;
  show_markers?: boolean;
  smoothing?: boolean;
  show_legends?: boolean;
  show_tooltip?: boolean;
};
// area chart
export type TAreaChartWidgetConfig = {
  color_scheme?: TWidgetChartColorScheme;
  fill_color?: string;
  line_color?: string;
  line_type?: TWidgetLineChartLineType;
  opacity?: number;
  show_border?: boolean;
  show_markers?: boolean;
  smoothing?: boolean;
  show_legends?: boolean;
  show_tooltip?: boolean;
};
// donut chart
export type TDonutChartWidgetConfig = {
  color_scheme?: TWidgetChartColorScheme;
  center_value?: boolean;
  completed_color?: string;
  show_legends?: boolean;
  show_tooltip?: boolean;
};
// pie chart
export type TPieChartWidgetConfig = {
  color_scheme?: TWidgetChartColorScheme;
  group_thin_pieces?: boolean;
  minimum_threshold?: number;
  group_name?: string;
  show_values?: boolean;
  value_type?: TWidgetPieChartValuesType;
  show_legends?: boolean;
  show_tooltip?: boolean;
};
// text
export type TNumberWidgetConfig = {
  text_alignment?: TWidgetTextAlignment;
  text_color?: string;
};
// combined
export type TDashboardWidgetConfig =
  | TBarChartWidgetConfig
  | TLineChartWidgetConfig
  | TAreaChartWidgetConfig
  | TDonutChartWidgetConfig
  | TPieChartWidgetConfig
  | TNumberWidgetConfig;

export type TDashboardWidget = {
  chart_model: EWidgetChartModels | undefined;
  chart_type: EWidgetChartTypes | undefined;
  config: TDashboardWidgetConfig | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  group_by: EWidgetXAxisProperty | null | undefined;
  height: number | undefined;
  id: string | undefined;
  name: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  width: number | undefined;
  x_axis_coord: number | undefined;
  x_axis_date_grouping: EWidgetXAxisDateGrouping | null | undefined;
  x_axis_property: EWidgetXAxisProperty | null | undefined;
  y_axis_coord: number | undefined;
  y_axis_metric: EWidgetYAxisMetric | null | undefined;
};

export type TDashboardWidgetsLayoutPayload = Pick<
  TDashboardWidget,
  "id" | "x_axis_coord" | "y_axis_coord" | "height" | "width"
>;

export type TDashboardWidgetDatum = {
  key: string;
  name: string;
  count: number;
} & Record<string, number>;

export type TDashboardWidgetData = {
  data: TDashboardWidgetDatum[];
  schema: Record<string, string>;
};
