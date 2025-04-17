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

export const CHART_COLOR_PALETTES: {
  key: TWidgetChartColorScheme;
  i18n_label: string;
  light: string[];
  dark: string[];
}[] = [
  {
    key: "modern",
    i18n_label: "dashboards.widget.color_palettes.modern",
    light: [
      "#6172E8",
      "#8B6EDB",
      "#E05F99",
      "#29A383",
      "#CB8A37",
      "#3AA7C1",
      "#F1B24A",
      "#E84855",
      "#50C799",
      "#B35F9E",
    ],
    dark: [
      "#6B7CDE",
      "#8E9DE6",
      "#D45D9E",
      "#2EAF85",
      "#D4A246",
      "#29A7C1",
      "#B89F6A",
      "#D15D64",
      "#4ED079",
      "#A169A4",
    ],
  },
  {
    key: "horizon",
    i18n_label: "dashboards.widget.color_palettes.horizon",
    light: [
      "#E76E50",
      "#289D90",
      "#F3A362",
      "#E9C368",
      "#264753",
      "#8A6FA0",
      "#5B9EE5",
      "#7CC474",
      "#BA7DB5",
      "#CF8640",
    ],
    dark: [
      "#E05A3A",
      "#1D8A7E",
      "#D98B4D",
      "#D1AC50",
      "#3A6B7C",
      "#7D6297",
      "#4D8ACD",
      "#569C64",
      "#C16A8C",
      "#B77436",
    ],
  },
  {
    key: "earthen",
    i18n_label: "dashboards.widget.color_palettes.earthen",
    light: [
      "#386641",
      "#6A994E",
      "#A7C957",
      "#E97F4E",
      "#BC4749",
      "#9E2A2B",
      "#80CED1",
      "#5C3E79",
      "#526EAB",
      "#6B5B95",
    ],
    dark: [
      "#497752",
      "#7BAA5F",
      "#B8DA68",
      "#FA905F",
      "#CD585A",
      "#AF3B3C",
      "#91DFE2",
      "#6D4F8A",
      "#637FBC",
      "#7C6CA6",
    ],
  },
];

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
