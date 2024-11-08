import {
  MAX_ESTIMATE_POINT_INPUT_LENGTH,
  EEstimateSystem,
  EEstimateUpdateStages,
  estimateCount,
  ESTIMATE_SYSTEMS,
} from "ce/constants/estimates";

estimateCount.max = 12;

ESTIMATE_SYSTEMS.points.templates.fibonacci.values = [
  ...ESTIMATE_SYSTEMS.points.templates.fibonacci.values,
  { id: undefined, key: 7, value: "21" },
  { id: undefined, key: 8, value: "34" },
  { id: undefined, key: 9, value: "55" },
];

ESTIMATE_SYSTEMS.points.templates.linear.values = [
  ...ESTIMATE_SYSTEMS.points.templates.linear.values,
  { id: undefined, key: 7, value: "7" },
  { id: undefined, key: 8, value: "8" },
  { id: undefined, key: 9, value: "9" },
];

ESTIMATE_SYSTEMS.points.templates.squares.values = [
  ...ESTIMATE_SYSTEMS.points.templates.squares.values,
  { id: undefined, key: 7, value: "49" },
  { id: undefined, key: 8, value: "64" },
  { id: undefined, key: 9, value: "81" },
];

export { MAX_ESTIMATE_POINT_INPUT_LENGTH, EEstimateSystem, EEstimateUpdateStages, estimateCount, ESTIMATE_SYSTEMS };

export const ESTIMATE_OPTIONS_STAGE_ONE: Partial<
  Record<EEstimateUpdateStages, { title: string; description: string }>
> = {
  [EEstimateUpdateStages.EDIT]: {
    title: "Add, update or remove estimates",
    description: "Manage current system either adding, updating or removing the points or categories.",
  },
  [EEstimateUpdateStages.SWITCH]: {
    title: "Change estimate type",
    description: "Convert your points system to categories system and vice versa.",
  },
};
