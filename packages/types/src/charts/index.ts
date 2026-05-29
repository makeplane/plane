// ============================================================
// Chart Base
// ============================================================
export * from "./common";
export type TChartLegend = {
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  layout: "horizontal" | "vertical";
  wrapperStyles?: React.CSSProperties;
};

export type TChartMargin = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export type TChartData<K extends string, T extends string> = {
  // required key
  [key in K]: string | number;
} & Record<T, any>;

export type TBaseChartProps<K extends string, T extends string> = {
  data: TChartData<K, T>[];
  className?: string;
  legend?: TChartLegend;
  margin?: TChartMargin;
  showTooltip?: boolean;
  customTooltipContent?: (props: { active?: boolean; label: string; payload: any }) => React.ReactNode;
};

// Props specific to charts with X and Y axes
export type TAxisChartProps<K extends string, T extends string> = TBaseChartProps<K, T> & {
  xAxis: {
    key: keyof TChartData<K, T>;
    label?: string;
    strokeColor?: string;
    dy?: number;
  };
  yAxis: {
    allowDecimals?: boolean;
    domain?: [number, number];
    key: keyof TChartData<K, T>;
    label?: string;
    strokeColor?: string;
    offset?: number;
    dx?: number;
  };
  tickCount?: {
    x?: number;
    y?: number;
  };
  customTicks?: {
    x?: React.ComponentType<unknown>;
    y?: React.ComponentType<unknown>;
  };
};

// ============================================================
// Bar Chart
// ============================================================

export type TBarChartShapeVariant = "bar" | "lollipop" | "lollipop-dotted";

export type TBarItem<T extends string> = {
  key: T;
  label: string;
  fill: string | ((payload: any) => string);
  textClassName: string;
  showPercentage?: boolean;
  stackId: string;
  showTopBorderRadius?: (barKey: string, payload: any) => boolean;
  showBottomBorderRadius?: (barKey: string, payload: any) => boolean;
  shapeVariant?: TBarChartShapeVariant;
};

export type TBarChartProps<K extends string, T extends string> = TAxisChartProps<K, T> & {
  bars: TBarItem<T>[];
  barSize?: number;
};

// ============================================================
// Line Chart
// ============================================================

export type TLineItem<T extends string> = {
  key: T;
  label: string;
  dashedLine: boolean;
  fill: string;
  showDot: boolean;
  smoothCurves: boolean;
  stroke: string;
  style?: Record<string, string | number>;
};

export type TLineChartProps<K extends string, T extends string> = TAxisChartProps<K, T> & {
  lines: TLineItem<T>[];
};

// ============================================================
// Scatter Chart
// ============================================================

export type TScatterPointItem<T extends string> = {
  key: T;
  label: string;
  fill: string;
  stroke: string;
};

export type TScatterChartProps<K extends string, T extends string> = TAxisChartProps<K, T> & {
  scatterPoints: TScatterPointItem<T>[];
};

// ============================================================
// Area Chart
// ============================================================

export type TAreaItem<T extends string> = {
  key: T;
  label: string;
  stackId: string;
  fill: string;
  fillOpacity: number;
  showDot: boolean;
  smoothCurves: boolean;
  strokeColor: string;
  strokeOpacity: number;
  style?: Record<string, string | number>;
};

export type TAreaChartProps<K extends string, T extends string> = TAxisChartProps<K, T> & {
  areas: TAreaItem<T>[];
  comparisonLine?: {
    dashedLine: boolean;
    strokeColor: string;
  };
};

// ============================================================
// Pie Chart
// ============================================================

export type TCellItem<T extends string> = {
  key: T;
  fill: string;
};

export type TPieChartProps<K extends string, T extends string> = Pick<
  TBaseChartProps<K, T>,
  "className" | "data" | "showTooltip" | "legend" | "margin"
> & {
  dataKey: T;
  cells: TCellItem<T>[];
  innerRadius?: number | string;
  outerRadius?: number | string;
  cornerRadius?: number;
  paddingAngle?: number;
  showLabel: boolean;
  customLabel?: (value: any) => string;
  centerLabel?: {
    className?: string;
    fill: string;
    style?: React.CSSProperties;
    text?: string | number;
  };
  tooltipLabel?: string | ((payload: any) => string);
  customLegend?: (props: any) => React.ReactNode;
};

// ============================================================
// Tree Map
// ============================================================

export type TreeMapItem = {
  name: string;
  value: number;
  label?: string;
  textClassName?: string;
  icon?: React.ReactElement;
} & (
  | {
      fillColor: string;
    }
  | {
      fillClassName: string;
    }
);

export type TreeMapChartProps = {
  data: TreeMapItem[];
  className?: string;
  isAnimationActive?: boolean;
  showTooltip?: boolean;
};

export type TTopSectionConfig = {
  showIcon: boolean;
  showName: boolean;
  nameTruncated: boolean;
};

export type TBottomSectionConfig = {
  show: boolean;
  showValue: boolean;
  showLabel: boolean;
  labelTruncated: boolean;
};

export type TContentVisibility = {
  top: TTopSectionConfig;
  bottom: TBottomSectionConfig;
};

// ============================================================
// Radar Chart
// ============================================================

export type TRadarItem<T extends string> = {
  key: T;
  name: string;
  fill?: string;
  stroke?: string;
  fillOpacity?: number;
  dot?: {
    r: number;
    fillOpacity: number;
  };
};

export type TRadarChartProps<K extends string, T extends string> = Pick<
  TBaseChartProps<K, T>,
  "className" | "showTooltip" | "margin" | "data" | "legend"
> & {
  dataKey: T;
  radars: TRadarItem<T>[];
  angleAxis: {
    key: keyof TChartData<K, T>;
    label?: string;
    strokeColor?: string;
  };
};
