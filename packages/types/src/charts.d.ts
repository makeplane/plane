export type TChartLegend = {
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  layout: "horizontal" | "vertical";
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

type TChartProps<K extends string, T extends string> = {
  data: TChartData<K, T>[];
  xAxis: {
    key: keyof TChartData<K, T>;
    label?: string;
    strokeColor?: string;
  };
  yAxis: {
    allowDecimals?: boolean;
    domain?: [number, number];
    key: keyof TChartData<K, T>;
    label?: string;
    strokeColor?: string;
  };
  className?: string;
  legend?: TChartLegend;
  margin?: TChartMargin;
  tickCount?: {
    x?: number;
    y?: number;
  };
  showTooltip?: boolean;
};

export type TBarItem<T extends string> = {
  key: T;
  label: string;
  fill: string | ((payload: any) => string);
  textClassName: string;
  showPercentage?: boolean;
  stackId: string;
  showTopBorderRadius?: (barKey: string, payload: any) => boolean;
  showBottomBorderRadius?: (barKey: string, payload: any) => boolean;
};

export type TBarChartProps<K extends string, T extends string> = TChartProps<K, T> & {
  bars: TBarItem<T>[];
  barSize?: number;
};

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

export type TLineChartProps<K extends string, T extends string> = TChartProps<K, T> & {
  lines: TLineItem<T>[];
};

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

export type TAreaChartProps<K extends string, T extends string> = TChartProps<K, T> & {
  areas: TAreaItem<T>[];
  comparisonLine?: {
    dashedLine: boolean;
    strokeColor: string;
  };
};

export type TCellItem<T extends string> = {
  key: T;
  fill: string;
};

export type TPieChartProps<K extends string, T extends string> = Pick<
  TChartProps<K, T>,
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
