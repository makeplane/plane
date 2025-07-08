// local imports
import {
  EWidgetChartModels,
  EWidgetChartTypes,
  EWidgetXAxisDateGrouping,
  EWidgetXAxisProperty,
  EWidgetYAxisMetric,
  TDashboardWidget,
} from "@plane/types";
import { E_FEATURE_FLAGS } from "../feature-flag";
import { DEFAULT_WIDGET_COLOR, DEFAULT_WIDGET_COLOR_SCHEME } from "./widgets";
import { EWidgetGridBreakpoints } from "./enums";

export const WIDGET_GRID_BREAKPOINTS: Record<EWidgetGridBreakpoints, number> = {
  [EWidgetGridBreakpoints.XXS]: 0,
  [EWidgetGridBreakpoints.MD]: 768,
};

export const CIRCULAR_WIDGET_CHART_TYPES: EWidgetChartTypes[] = [
  EWidgetChartTypes.DONUT_CHART,
  EWidgetChartTypes.PIE_CHART,
];

export const WIDGET_CHART_TYPES_LIST: {
  key: EWidgetChartTypes;
  i18n_short_label: string;
  i18n_long_label: string;
}[] = [
  {
    key: EWidgetChartTypes.BAR_CHART,
    i18n_short_label: "dashboards.widget.chart_types.bar_chart.short_label",
    i18n_long_label: "dashboards.widget.chart_types.bar_chart.long_label",
  },
  {
    key: EWidgetChartTypes.LINE_CHART,
    i18n_short_label: "dashboards.widget.chart_types.line_chart.short_label",
    i18n_long_label: "dashboards.widget.chart_types.line_chart.long_label",
  },
  {
    key: EWidgetChartTypes.AREA_CHART,
    i18n_short_label: "dashboards.widget.chart_types.area_chart.short_label",
    i18n_long_label: "dashboards.widget.chart_types.area_chart.long_label",
  },
  {
    key: EWidgetChartTypes.DONUT_CHART,
    i18n_short_label: "dashboards.widget.chart_types.donut_chart.short_label",
    i18n_long_label: "dashboards.widget.chart_types.donut_chart.long_label",
  },
  {
    key: EWidgetChartTypes.PIE_CHART,
    i18n_short_label: "dashboards.widget.chart_types.pie_chart.short_label",
    i18n_long_label: "dashboards.widget.chart_types.pie_chart.long_label",
  },
  {
    key: EWidgetChartTypes.NUMBER,
    i18n_short_label: "dashboards.widget.chart_types.number.short_label",
    i18n_long_label: "dashboards.widget.chart_types.number.long_label",
  },
];

export const DEFAULT_WIDGET_CHART_TYPE_PAYLOAD: {
  [ChartType in EWidgetChartTypes]: {
    [ModelType in EWidgetChartModels]?: Partial<TDashboardWidget>;
  } & Partial<TDashboardWidget>;
} = {
  [EWidgetChartTypes.BAR_CHART]: {
    config: {
      orientation: "vertical",
      show_legends: true,
      show_tooltip: true,
    },
    [EWidgetChartModels.BASIC]: {
      config: {
        bar_color: DEFAULT_WIDGET_COLOR,
      },
    },
    [EWidgetChartModels.STACKED]: {
      config: {
        color_scheme: DEFAULT_WIDGET_COLOR_SCHEME,
      },
    },
    [EWidgetChartModels.GROUPED]: {
      config: {
        color_scheme: DEFAULT_WIDGET_COLOR_SCHEME,
      },
    },
  },
  [EWidgetChartTypes.LINE_CHART]: {
    config: {
      line_type: "solid",
      smoothing: true,
      show_markers: true,
      show_legends: true,
      show_tooltip: true,
    },
    [EWidgetChartModels.BASIC]: {
      config: {
        line_color: DEFAULT_WIDGET_COLOR,
      },
    },
    [EWidgetChartModels.MULTI_LINE]: {
      config: {
        color_scheme: DEFAULT_WIDGET_COLOR_SCHEME,
      },
    },
  },
  [EWidgetChartTypes.AREA_CHART]: {
    config: {
      opacity: 0.2,
      show_border: true,
      smoothing: true,
      show_markers: true,
      show_legends: true,
      show_tooltip: true,
    },
    [EWidgetChartModels.BASIC]: {
      config: {
        fill_color: DEFAULT_WIDGET_COLOR,
      },
    },
    [EWidgetChartModels.STACKED]: {
      config: {
        color_scheme: DEFAULT_WIDGET_COLOR_SCHEME,
      },
    },
    [EWidgetChartModels.COMPARISON]: {
      config: {
        fill_color: DEFAULT_WIDGET_COLOR,
        line_color: "#878787",
        line_type: "dashed",
      },
    },
  },
  [EWidgetChartTypes.DONUT_CHART]: {
    config: {
      center_value: true,
      show_legends: true,
      show_tooltip: true,
    },
    [EWidgetChartModels.BASIC]: {
      config: {
        color_scheme: DEFAULT_WIDGET_COLOR_SCHEME,
      },
    },
    [EWidgetChartModels.PROGRESS]: {
      x_axis_property: EWidgetXAxisProperty.STATE_GROUPS,
      config: {
        completed_color: DEFAULT_WIDGET_COLOR,
      },
    },
  },
  [EWidgetChartTypes.PIE_CHART]: {
    config: {
      show_legends: true,
      show_tooltip: true,
    },
    [EWidgetChartModels.BASIC]: {
      config: {
        group_thin_pieces: false,
        show_values: true,
        value_type: "count",
        color_scheme: DEFAULT_WIDGET_COLOR_SCHEME,
      },
    },
  },
  [EWidgetChartTypes.NUMBER]: {
    [EWidgetChartModels.BASIC]: {
      config: {
        text_alignment: "left",
        text_color: "#787878",
      },
    },
  },
};

export const WIDGET_CHART_MODELS_LIST: Record<
  EWidgetChartTypes,
  {
    value: EWidgetChartModels;
    i18n_short_label: string;
    i18n_long_label: string;
    flags: E_FEATURE_FLAGS[];
  }[]
> = {
  [EWidgetChartTypes.BAR_CHART]: [
    {
      value: EWidgetChartModels.BASIC,
      i18n_short_label: "dashboards.widget.chart_types.bar_chart.chart_models.basic.short_label",
      i18n_long_label: "dashboards.widget.chart_types.bar_chart.chart_models.basic.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS, E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
    {
      value: EWidgetChartModels.STACKED,
      i18n_short_label: "dashboards.widget.chart_types.bar_chart.chart_models.stacked.short_label",
      i18n_long_label: "dashboards.widget.chart_types.bar_chart.chart_models.stacked.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
    {
      value: EWidgetChartModels.GROUPED,
      i18n_short_label: "dashboards.widget.chart_types.bar_chart.chart_models.grouped.short_label",
      i18n_long_label: "dashboards.widget.chart_types.bar_chart.chart_models.grouped.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
  ],
  [EWidgetChartTypes.LINE_CHART]: [
    {
      value: EWidgetChartModels.BASIC,
      i18n_short_label: "dashboards.widget.chart_types.line_chart.chart_models.basic.short_label",
      i18n_long_label: "dashboards.widget.chart_types.line_chart.chart_models.basic.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS, E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
    {
      value: EWidgetChartModels.MULTI_LINE,
      i18n_short_label: "dashboards.widget.chart_types.line_chart.chart_models.multi_line.short_label",
      i18n_long_label: "dashboards.widget.chart_types.line_chart.chart_models.multi_line.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
  ],
  [EWidgetChartTypes.AREA_CHART]: [
    {
      value: EWidgetChartModels.BASIC,
      i18n_short_label: "dashboards.widget.chart_types.area_chart.chart_models.basic.short_label",
      i18n_long_label: "dashboards.widget.chart_types.area_chart.chart_models.basic.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS, E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
    {
      value: EWidgetChartModels.STACKED,
      i18n_short_label: "dashboards.widget.chart_types.area_chart.chart_models.stacked.short_label",
      i18n_long_label: "dashboards.widget.chart_types.area_chart.chart_models.stacked.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
    {
      value: EWidgetChartModels.COMPARISON,
      i18n_short_label: "dashboards.widget.chart_types.area_chart.chart_models.comparison.short_label",
      i18n_long_label: "dashboards.widget.chart_types.area_chart.chart_models.comparison.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
  ],
  [EWidgetChartTypes.DONUT_CHART]: [
    {
      value: EWidgetChartModels.BASIC,
      i18n_short_label: "dashboards.widget.chart_types.donut_chart.chart_models.basic.short_label",
      i18n_long_label: "dashboards.widget.chart_types.donut_chart.chart_models.basic.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS, E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
    {
      value: EWidgetChartModels.PROGRESS,
      i18n_short_label: "dashboards.widget.chart_types.donut_chart.chart_models.progress.short_label",
      i18n_long_label: "dashboards.widget.chart_types.donut_chart.chart_models.progress.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
  ],
  [EWidgetChartTypes.PIE_CHART]: [
    {
      value: EWidgetChartModels.BASIC,
      i18n_short_label: "dashboards.widget.chart_types.pie_chart.chart_models.basic.short_label",
      i18n_long_label: "dashboards.widget.chart_types.pie_chart.chart_models.basic.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS, E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
  ],
  [EWidgetChartTypes.NUMBER]: [
    {
      value: EWidgetChartModels.BASIC,
      i18n_short_label: "dashboards.widget.chart_types.number.chart_models.basic.short_label",
      i18n_long_label: "dashboards.widget.chart_types.number.chart_models.basic.long_label",
      flags: [E_FEATURE_FLAGS.DASHBOARDS, E_FEATURE_FLAGS.DASHBOARDS_ADVANCED],
    },
  ],
};

export const WIDGET_X_AXIS_PROPERTIES_LIST: Record<
  EWidgetXAxisProperty,
  {
    i18n_label: string;
  }
> = {
  [EWidgetXAxisProperty.STATES]: {
    i18n_label: "common.state",
  },
  [EWidgetXAxisProperty.STATE_GROUPS]: {
    i18n_label: "common.state_group",
  },
  [EWidgetXAxisProperty.LABELS]: {
    i18n_label: "common.label",
  },
  [EWidgetXAxisProperty.ASSIGNEES]: {
    i18n_label: "common.assignee",
  },
  [EWidgetXAxisProperty.ESTIMATE_POINTS]: {
    i18n_label: "common.estimate",
  },
  [EWidgetXAxisProperty.CYCLES]: {
    i18n_label: "common.cycle",
  },
  [EWidgetXAxisProperty.MODULES]: {
    i18n_label: "common.module",
  },
  [EWidgetXAxisProperty.PRIORITY]: {
    i18n_label: "common.priority",
  },
  [EWidgetXAxisProperty.WORK_ITEM_TYPES]: {
    i18n_label: "work_item_types.label",
  },
  [EWidgetXAxisProperty.PROJECTS]: {
    i18n_label: "common.project",
  },
  [EWidgetXAxisProperty.START_DATE]: {
    i18n_label: "start_date",
  },
  [EWidgetXAxisProperty.TARGET_DATE]: {
    i18n_label: "due_date",
  },
  [EWidgetXAxisProperty.CREATED_AT]: {
    i18n_label: "common.created_at",
  },
  [EWidgetXAxisProperty.COMPLETED_AT]: {
    i18n_label: "common.completed_at",
  },
  [EWidgetXAxisProperty.CREATED_BY]: {
    i18n_label: "common.created_by",
  },
  [EWidgetXAxisProperty.EPICS]: {
    i18n_label: "common.epics",
  },
};

export const WIDGET_X_AXIS_DATE_PROPERTIES: EWidgetXAxisProperty[] = [
  EWidgetXAxisProperty.START_DATE,
  EWidgetXAxisProperty.TARGET_DATE,
  EWidgetXAxisProperty.CREATED_AT,
  EWidgetXAxisProperty.COMPLETED_AT,
];

export const WIDGET_X_AXIS_DATE_GROUPINGS_LIST: Record<
  EWidgetXAxisDateGrouping,
  {
    i18n_label: string;
  }
> = {
  [EWidgetXAxisDateGrouping.DAY]: {
    i18n_label: "dashboards.widget.common.daily",
  },
  [EWidgetXAxisDateGrouping.WEEK]: {
    i18n_label: "dashboards.widget.common.weekly",
  },
  [EWidgetXAxisDateGrouping.MONTH]: {
    i18n_label: "dashboards.widget.common.monthly",
  },
  [EWidgetXAxisDateGrouping.YEAR]: {
    i18n_label: "dashboards.widget.common.yearly",
  },
};

export const ALL_WIDGETS_Y_AXIS_METRICS_LIST: Record<
  EWidgetYAxisMetric,
  {
    i18n_label: string;
  }
> = {
  [EWidgetYAxisMetric.WORK_ITEM_COUNT]: {
    i18n_label: "dashboards.widget.common.work_item_count",
  },
  [EWidgetYAxisMetric.ESTIMATE_POINT_COUNT]: {
    i18n_label: "dashboards.widget.common.estimate_point",
  },
  [EWidgetYAxisMetric.PENDING_WORK_ITEM_COUNT]: {
    i18n_label: "dashboards.widget.common.pending_work_item",
  },
  [EWidgetYAxisMetric.COMPLETED_WORK_ITEM_COUNT]: {
    i18n_label: "dashboards.widget.common.completed_work_item",
  },
  [EWidgetYAxisMetric.IN_PROGRESS_WORK_ITEM_COUNT]: {
    i18n_label: "dashboards.widget.common.in_progress_work_item",
  },
  [EWidgetYAxisMetric.BLOCKED_WORK_ITEM_COUNT]: {
    i18n_label: "dashboards.widget.common.blocked_work_item",
  },
  [EWidgetYAxisMetric.WORK_ITEM_DUE_THIS_WEEK_COUNT]: {
    i18n_label: "dashboards.widget.common.work_item_due_this_week",
  },
  [EWidgetYAxisMetric.WORK_ITEM_DUE_TODAY_COUNT]: {
    i18n_label: "dashboards.widget.common.work_item_due_today",
  },
};

export const CHART_WIDGETS_Y_AXIS_METRICS_LIST: EWidgetYAxisMetric[] = [
  EWidgetYAxisMetric.WORK_ITEM_COUNT,
  EWidgetYAxisMetric.ESTIMATE_POINT_COUNT,
];

export const NUMBER_WIDGET_Y_AXIS_METRICS_LIST: EWidgetYAxisMetric[] = [
  EWidgetYAxisMetric.WORK_ITEM_COUNT,
  EWidgetYAxisMetric.PENDING_WORK_ITEM_COUNT,
  EWidgetYAxisMetric.COMPLETED_WORK_ITEM_COUNT,
  EWidgetYAxisMetric.IN_PROGRESS_WORK_ITEM_COUNT,
  EWidgetYAxisMetric.BLOCKED_WORK_ITEM_COUNT,
  EWidgetYAxisMetric.WORK_ITEM_DUE_THIS_WEEK_COUNT,
  EWidgetYAxisMetric.WORK_ITEM_DUE_TODAY_COUNT,
];

export const TO_CAPITALIZE_PROPERTIES: EWidgetXAxisProperty[] = [
  EWidgetXAxisProperty.PRIORITY,
  EWidgetXAxisProperty.STATE_GROUPS,
];

export const WIDGET_DROPDOWN_SECTIONS: {
  key: string;
  i18n_label: string;
  widgets: {
    key: EWidgetChartTypes;
    i18n_label: string;
    models: {
      value: EWidgetChartModels;
      i18n_short_label: string;
      i18n_long_label: string;
      flags: E_FEATURE_FLAGS[];
    }[];
  }[];
}[] = [
  {
    key: "charts",
    i18n_label: "dashboards.widget.sections.charts",
    widgets: [
      {
        key: EWidgetChartTypes.BAR_CHART,
        i18n_label: "dashboards.widget.chart_types.bar_chart.short_label",
        models: WIDGET_CHART_MODELS_LIST[EWidgetChartTypes.BAR_CHART],
      },
      {
        key: EWidgetChartTypes.LINE_CHART,
        i18n_label: "dashboards.widget.chart_types.line_chart.short_label",
        models: WIDGET_CHART_MODELS_LIST[EWidgetChartTypes.LINE_CHART],
      },
      {
        key: EWidgetChartTypes.AREA_CHART,
        i18n_label: "dashboards.widget.chart_types.area_chart.short_label",
        models: WIDGET_CHART_MODELS_LIST[EWidgetChartTypes.AREA_CHART],
      },
      {
        key: EWidgetChartTypes.DONUT_CHART,
        i18n_label: "dashboards.widget.chart_types.donut_chart.short_label",
        models: WIDGET_CHART_MODELS_LIST[EWidgetChartTypes.DONUT_CHART],
      },
      {
        key: EWidgetChartTypes.PIE_CHART,
        i18n_label: "dashboards.widget.chart_types.pie_chart.short_label",
        models: WIDGET_CHART_MODELS_LIST[EWidgetChartTypes.PIE_CHART],
      },
    ],
  },
  {
    key: "text",
    i18n_label: "dashboards.widget.sections.text",
    widgets: [
      {
        key: EWidgetChartTypes.NUMBER,
        i18n_label: "dashboards.widget.chart_types.number.short_label",
        models: WIDGET_CHART_MODELS_LIST[EWidgetChartTypes.NUMBER],
      },
    ],
  },
];
