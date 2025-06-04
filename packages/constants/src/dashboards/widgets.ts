// plane imports
import {
  TWidgetBarChartOrientation,
  TWidgetChartColorScheme,
  TWidgetLineChartLineType,
  TWidgetPieChartValuesType,
  TWidgetTextAlignment,
} from "@plane/types";

export const DEFAULT_WIDGET_COLOR_SCHEME: TWidgetChartColorScheme = "earthen";
export const DEFAULT_WIDGET_COLOR = "#049bdc";

export const BAR_CHART_ORIENTATIONS: {
  key: TWidgetBarChartOrientation;
  i18n_label: string;
}[] = [
  {
    key: "vertical",
    i18n_label: "dashboards.widget.chart_types.bar_chart.orientation.vertical",
  },
  {
    key: "horizontal",
    i18n_label: "dashboards.widget.chart_types.bar_chart.orientation.horizontal",
  },
];

export const LINE_CHART_LINE_TYPES: {
  key: TWidgetLineChartLineType;
  i18n_label: string;
}[] = [
  {
    key: "solid",
    i18n_label: "dashboards.widget.chart_types.line_chart.line_type.solid",
  },
  {
    key: "dashed",
    i18n_label: "dashboards.widget.chart_types.line_chart.line_type.dashed",
  },
];

export const TEXT_ALIGNMENTS: {
  key: TWidgetTextAlignment;
  i18n_label: string;
}[] = [
  {
    key: "left",
    i18n_label: "dashboards.widget.chart_types.number.alignment.left",
  },
  {
    key: "center",
    i18n_label: "dashboards.widget.chart_types.number.alignment.center",
  },
  {
    key: "right",
    i18n_label: "dashboards.widget.chart_types.number.alignment.right",
  },
];

export const PIE_CHART_VALUE_TYPE: {
  key: TWidgetPieChartValuesType;
  i18n_label: string;
}[] = [
  {
    key: "percentage",
    i18n_label: "dashboards.widget.chart_types.pie_chart.value_type.percentage",
  },
  {
    key: "count",
    i18n_label: "dashboards.widget.chart_types.pie_chart.value_type.count",
  },
];
