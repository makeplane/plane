export type TStackItem<T extends string> = {
  key: T;
  fillClassName: string;
  textClassName: string;
  dotClassName?: string;
  showPercentage?: boolean;
};

export type TStackChartData<K extends string, T extends string> = {
  [key in K]: string | number;
} & Record<T, any>;

export type TStackedBarChartProps<K extends string, T extends string> = {
  data: TStackChartData<K, T>[];
  stacks: TStackItem<T>[];
  xAxis: {
    key: keyof TStackChartData<K, T>;
    label: string;
  };
  yAxis: {
    key: keyof TStackChartData<K, T>;
    label: string;
    domain?: [number, number];
    allowDecimals?: boolean;
  };
  barSize?: number;
  className?: string;
  tickCount?: {
    x?: number;
    y?: number;
  };
  showTooltip?: boolean;
};

export type TreeMapItem = {
  name: string;
  value: number;
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
};
