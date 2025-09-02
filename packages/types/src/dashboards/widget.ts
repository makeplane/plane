import { LOGICAL_OPERATOR, TFilterExpression, TFilterValue } from "../rich-filters";

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

export type TChartBaseConfig = {
  show_legends?: boolean;
  show_tooltip?: boolean;
  color_scheme?: TWidgetChartColorScheme;
  filters?: TExternalDashboardWidgetFilterExpression;
};

export type TBarChartWidgetConfig = TChartBaseConfig & {
  bar_color?: string;
  orientation?: TWidgetBarChartOrientation;
};
// line chart
export type TLineChartWidgetConfig = TChartBaseConfig & {
  line_color?: string;
  line_type?: TWidgetLineChartLineType;
  show_markers?: boolean;
  smoothing?: boolean;
};
// area chart
export type TAreaChartWidgetConfig = TChartBaseConfig & {
  fill_color?: string;
  line_color?: string;
  line_type?: TWidgetLineChartLineType;
  opacity?: number;
  show_border?: boolean;
  show_markers?: boolean;
  smoothing?: boolean;
};
// donut chart
export type TDonutChartWidgetConfig = TChartBaseConfig & {
  center_value?: boolean;
  completed_color?: string;
};
// pie chart
export type TPieChartWidgetConfig = TChartBaseConfig & {
  group_thin_pieces?: boolean;
  minimum_threshold?: number;
  group_name?: string;
  show_values?: boolean;
  value_type?: TWidgetPieChartValuesType;
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
  filters: TExternalDashboardWidgetFilterExpression | null;
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

// filters
export type TDashboardWidgetFilterKeys =
  | "assignee_id"
  | "cycle_id"
  | "module_id"
  | "mention_id"
  | "created_by_id"
  | "label_id"
  | "is_archived"
  | "state_group"
  | "state_id"
  | "type_id"
  // | "start_date"
  // | "target_date"
  | "is_draft"
  | "priority";

export type TExternalWidgetFieldOperator = "is" | "in" | "range";
export const EXTERNAL_WIDGET_OPERATOR_SEPARATOR = "__";

export type TExternalDashboardWidgetFilterAndGroup = {
  [LOGICAL_OPERATOR.AND]: TExternalDashboardWidgetFilterExpression[];
};

export type TExternalDashboardWidgetFilterOrGroup = {
  [LOGICAL_OPERATOR.OR]: TExternalDashboardWidgetFilterExpression[];
};

export type TExternalDashboardWidgetFilterNotGroup = {
  [LOGICAL_OPERATOR.NOT]: TExternalDashboardWidgetFilterExpression;
};

export type TExternalDashboardWidgetFilterGroup =
  | TExternalDashboardWidgetFilterAndGroup
  | TExternalDashboardWidgetFilterOrGroup
  | TExternalDashboardWidgetFilterNotGroup;

export type TExternalDashboardWidgetFilterExpressionData =
  | {
      [key in TDashboardWidgetFilterKeys]?: TFilterValue;
    }
  | TExternalDashboardWidgetFilterGroup;

export type TInternalDashboardWidgetFilterExpression = TFilterExpression<TDashboardWidgetFilterKeys>;
export type TExternalDashboardWidgetFilterExpression = TExternalDashboardWidgetFilterExpressionData;
