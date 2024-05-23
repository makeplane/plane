export enum EEstimateSystem {
  POINTS = "points",
  CATEGORIES = "categories",
  TIME = "time",
}
export type TEstimateSystemKeys = EEstimateSystem.POINTS | EEstimateSystem.CATEGORIES | EEstimateSystem.TIME;

export type TEstimatePointString = { key: number; value: string; id: string };
export type TEstimatePointNumeric = { key: number; value: number; id: string };
export type TEstimateSystemKeyObject = {
  points: TEstimatePointNumeric[];
  categories: TEstimatePointString[];
  time: TEstimatePointNumeric[];
};

export type TTemplateValues<T extends TEstimateSystemKeys> = {
  title: string;
  values: TEstimateSystemKeyObject[T];
};

export type TEstimateSystem<T extends TEstimateSystemKeys> = {
  name: string;
  templates: Record<string, TTemplateValues<T>>;
  is_available: boolean;
};

export type TEstimateSystems = {
  [K in TEstimateSystemKeys]: TEstimateSystem<K>;
};
