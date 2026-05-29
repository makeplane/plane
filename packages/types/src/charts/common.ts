export type TChartColorScheme = "modern" | "horizon" | "earthen";

export type TChartDatum = {
  key: string;
  name: string;
  count: number;
} & Record<string, number>;

export type TChart = {
  data: TChartDatum[];
  schema: Record<string, string>;
};
