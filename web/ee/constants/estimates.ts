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

ESTIMATE_SYSTEMS.time.is_available = true;
ESTIMATE_SYSTEMS.time.is_ee = false;

ESTIMATE_SYSTEMS.time.templates = {
  ...ESTIMATE_SYSTEMS.time.templates,
  hours: {
    title: "Hours",
    i18n_title: "project_settings.estimates.systems.time.hours",
    values: [
      { id: undefined, key: 1, value: "60" },
      { id: undefined, key: 2, value: "120" },
      { id: undefined, key: 3, value: "180" },
      { id: undefined, key: 4, value: "240" },
      { id: undefined, key: 5, value: "330" },
      { id: undefined, key: 6, value: "390" },
    ],
  },
  custom: {
    title: "Custom",
    i18n_title: "project_settings.estimates.systems.time.custom",
    values: [
      { id: undefined, key: 1, value: "60" },
      { id: undefined, key: 2, value: "120" },
    ],
    hide: true,
  },
};

export { MAX_ESTIMATE_POINT_INPUT_LENGTH, EEstimateSystem, EEstimateUpdateStages, estimateCount, ESTIMATE_SYSTEMS };

export const ESTIMATE_OPTIONS_STAGE_ONE: Partial<
  Record<EEstimateUpdateStages, { i18n_title: string; i18n_description: string }>
> = {
  [EEstimateUpdateStages.EDIT]: {
    i18n_title: "project_settings.estimates.edit.add_or_update.title",
    i18n_description: "project_settings.estimates.edit.add_or_update.description",
  },
  [EEstimateUpdateStages.SWITCH]: {
    i18n_title: "project_settings.estimates.edit.switch.title",
    i18n_description: "project_settings.estimates.edit.switch.description",
  },
};
