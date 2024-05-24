export enum EEstimateSystem {
  POINTS = "points",
  CATEGORIES = "categories",
  TIME = "time",
}
export type TEstimateSystemKeys = EEstimateSystem.POINTS | EEstimateSystem.CATEGORIES | EEstimateSystem.TIME;

export type TEstimatePointsObject = { id?: string | undefined; key: number; value: string };

export type TTemplateValues = {
  title: string;
  values: TEstimatePointsObject[];
};

export type TEstimateSystem = {
  name: string;
  templates: Record<string, TTemplateValues>;
  is_available: boolean;
};

export type TEstimateSystems = {
  [K in TEstimateSystemKeys]: TEstimateSystem;
};
