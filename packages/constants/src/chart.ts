import { TChartColorScheme } from "@plane/types";

export const LABEL_CLASSNAME = "uppercase text-custom-text-300/60 text-sm tracking-wide";
export const AXIS_LABEL_CLASSNAME = "uppercase text-custom-text-300/60 text-sm tracking-wide";


export const ChartXAxisProperty = {
  STATES: "STATES",
  STATE_GROUPS: "STATE_GROUPS",
  LABELS: "LABELS",
  ASSIGNEES: "ASSIGNEES",
  ESTIMATE_POINTS: "ESTIMATE_POINTS",
  CYCLES: "CYCLES",
  MODULES: "MODULES",
  PRIORITY: "PRIORITY",
  START_DATE: "START_DATE",
  TARGET_DATE: "TARGET_DATE",
  CREATED_AT: "CREATED_AT",
  COMPLETED_AT: "COMPLETED_AT",
  CREATED_BY: "CREATED_BY",
  WORK_ITEM_TYPES: "WORK_ITEM_TYPES",
  PROJECTS: "PROJECTS",
  EPICS: "EPICS",
} as const;

export type ChartXAxisProperty = typeof ChartXAxisProperty[keyof typeof ChartXAxisProperty];

export const ChartYAxisMetric = {
  WORK_ITEM_COUNT: "WORK_ITEM_COUNT",
  ESTIMATE_POINT_COUNT: "ESTIMATE_POINT_COUNT",
  PENDING_WORK_ITEM_COUNT: "PENDING_WORK_ITEM_COUNT",
  COMPLETED_WORK_ITEM_COUNT: "COMPLETED_WORK_ITEM_COUNT",
  IN_PROGRESS_WORK_ITEM_COUNT: "IN_PROGRESS_WORK_ITEM_COUNT",
  WORK_ITEM_DUE_THIS_WEEK_COUNT: "WORK_ITEM_DUE_THIS_WEEK_COUNT",
  WORK_ITEM_DUE_TODAY_COUNT: "WORK_ITEM_DUE_TODAY_COUNT",
  BLOCKED_WORK_ITEM_COUNT: "BLOCKED_WORK_ITEM_COUNT",
} as const;

export type ChartYAxisMetric = typeof ChartYAxisMetric[keyof typeof ChartYAxisMetric];


export const ChartXAxisDateGrouping = {
  DAY: "DAY",
  WEEK: "WEEK",
  MONTH: "MONTH",
  YEAR: "YEAR",
} as const;

export type ChartXAxisDateGrouping = typeof ChartXAxisDateGrouping[keyof typeof ChartXAxisDateGrouping];

export const TO_CAPITALIZE_PROPERTIES: ChartXAxisProperty[] = [
  ChartXAxisProperty.PRIORITY,
  ChartXAxisProperty.STATE_GROUPS,
];

export const CHART_X_AXIS_DATE_PROPERTIES: ChartXAxisProperty[] = [
  ChartXAxisProperty.START_DATE,
  ChartXAxisProperty.TARGET_DATE,
  ChartXAxisProperty.CREATED_AT,
  ChartXAxisProperty.COMPLETED_AT,
];


export const EChartModels = {
  BASIC: "BASIC",
  STACKED: "STACKED",
  GROUPED: "GROUPED",
  MULTI_LINE: "MULTI_LINE",
  COMPARISON: "COMPARISON",
  PROGRESS: "PROGRESS",
} as const;

export type EChartModels = typeof EChartModels[keyof typeof EChartModels];

export const CHART_COLOR_PALETTES: {
  key: TChartColorScheme;
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
