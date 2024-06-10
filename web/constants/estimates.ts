// types
import { TEstimateSystems } from "@plane/types";

export enum EEstimateSystem {
  POINTS = "points",
  CATEGORIES = "categories",
  TIME = "time",
}

export enum EEstimateUpdateStages {
  CREATE = "create",
  EDIT = "edit",
  SWITCH = "switch",
}

export const maxEstimatesCount = 11;

export const ESTIMATE_SYSTEMS: TEstimateSystems = {
  points: {
    name: "Points",
    templates: {
      fibonacci: {
        title: "Fibonacci",
        values: [
          { id: undefined, key: 1, value: "1" },
          { id: undefined, key: 2, value: "2" },
          { id: undefined, key: 3, value: "3" },
          { id: undefined, key: 4, value: "5" },
          { id: undefined, key: 5, value: "8" },
          { id: undefined, key: 6, value: "13" },
          { id: undefined, key: 7, value: "21" },
        ],
      },
      linear: {
        title: "Linear",
        values: [
          { id: undefined, key: 1, value: "1" },
          { id: undefined, key: 2, value: "2" },
          { id: undefined, key: 3, value: "3" },
          { id: undefined, key: 4, value: "4" },
          { id: undefined, key: 5, value: "5" },
          { id: undefined, key: 6, value: "6" },
          { id: undefined, key: 7, value: "7" },
          { id: undefined, key: 8, value: "8" },
          { id: undefined, key: 9, value: "9" },
          { id: undefined, key: 10, value: "10" },
        ],
      },
      squares: {
        title: "Squares",
        values: [
          { id: undefined, key: 1, value: "1" },
          { id: undefined, key: 2, value: "4" },
          { id: undefined, key: 3, value: "9" },
          { id: undefined, key: 4, value: "16" },
          { id: undefined, key: 5, value: "25" },
          { id: undefined, key: 6, value: "36" },
        ],
      },
      custom: {
        title: "Custom",
        values: [
          { id: undefined, key: 1, value: "1" },
          { id: undefined, key: 2, value: "2" },
        ],
        hide: true,
      },
    },
    is_available: true,
    is_ee: false,
  },
  categories: {
    name: "Categories",
    templates: {
      t_shirt_sizes: {
        title: "T-Shirt Sizes",
        values: [
          { id: undefined, key: 1, value: "XS" },
          { id: undefined, key: 2, value: "S" },
          { id: undefined, key: 3, value: "M" },
          { id: undefined, key: 4, value: "L" },
          { id: undefined, key: 5, value: "XL" },
          { id: undefined, key: 6, value: "XXL" },
        ],
      },
      easy_to_hard: {
        title: "Easy to hard",
        values: [
          { id: undefined, key: 1, value: "Easy" },
          { id: undefined, key: 2, value: "Medium" },
          { id: undefined, key: 3, value: "Hard" },
          { id: undefined, key: 4, value: "Very Hard" },
        ],
      },
      custom: {
        title: "Custom",
        values: [
          { id: undefined, key: 1, value: "Easy" },
          { id: undefined, key: 2, value: "Hard" },
        ],
        hide: true,
      },
    },
    is_available: true,
    is_ee: false,
  },
  time: {
    name: "Time",
    templates: {
      hours: {
        title: "Hours",
        values: [
          { id: undefined, key: 1, value: "1" },
          { id: undefined, key: 2, value: "2" },
          { id: undefined, key: 3, value: "3" },
          { id: undefined, key: 4, value: "4" },
          { id: undefined, key: 5, value: "5" },
          { id: undefined, key: 6, value: "6" },
          { id: undefined, key: 7, value: "7" },
          { id: undefined, key: 8, value: "8" },
          { id: undefined, key: 9, value: "9" },
          { id: undefined, key: 10, value: "10" },
        ],
      },
    },
    is_available: false,
    is_ee: true,
  },
};

export const ESTIMATE_OPTIONS_STAGE_ONE = [
  {
    key: EEstimateUpdateStages.EDIT,
    title: "Add, update or remove estimates",
    description: "Manage current system either adding, updating or removing the points or categories.",
    is_ee: true,
  },
  {
    key: EEstimateUpdateStages.SWITCH,
    title: "Change estimate type",
    description: "Convert your points system to categories system and vice versa.",
    is_ee: true,
  },
];
