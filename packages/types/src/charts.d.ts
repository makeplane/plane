export type TChartData<K extends string, T extends string> = {
  // required key
  [key in K]: string | number;
} & Record<T, any>;

type TChartProps<K extends string, T extends string> = {
  data: TChartData<K, T>[];
  xAxis: {
    key: keyof TChartData<K, T>;
    label: string;
  };
  yAxis: {
    key: keyof TChartData<K, T>;
    label: string;
    domain?: [number, number];
    allowDecimals?: boolean;
  };
  className?: string;
  tickCount?: {
    x?: number;
    y?: number;
  };
  showTooltip?: boolean;
};

export type TBarItem<T extends string> = {
  key: T;
  fillClassName: string;
  textClassName: string;
  dotClassName?: string;
  showPercentage?: boolean;
  stackId: string;
};

export type TBarChartProps<K extends string, T extends string> = TChartProps<K, T> & {
  bars: TBarItem<T>[];
  barSize?: number;
};

export type TLineItem<T extends string> = {
  key: T;
  className?: string;
  style?: Record<string, string | number>;
  dotClassName?: string;
};

export type TLineChartProps<K extends string, T extends string> = TChartProps<K, T> & {
  lines: TLineItem<T>[];
};

export type TAreaItem<T extends string> = {
  key: T;
  stackId: string;
  className?: string;
  style?: Record<string, string | number>;
  dotClassName?: string;
};

export type TAreaChartProps<K extends string, T extends string> = TChartProps<K, T> & {
  areas: TAreaItem<T>[];
};

export type TCellItem<T extends string> = {
  key: T;
  className?: string;
  style?: Record<string, string | number>;
  dotClassName?: string;
};

export type TPieChartProps<K extends string, T extends string> = Pick<
  TChartProps<K, T>,
  "className" | "data" | "showTooltip"
> & {
  dataKey: T;
  cells: TCellItem<T>[];
  innerRadius?: number;
  outerRadius?: number;
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
