import { TEstimateSystems } from "@/ee/components/estimates/types";

export const ESTIMATE_SYSTEMS: TEstimateSystems = {
  points: {
    name: "Points",
    templates: {
      fibonacci: {
        title: "Fibonacci",
        values: [
          { key: 1, value: 1 },
          { key: 2, value: 2 },
          { key: 3, value: 3 },
          { key: 4, value: 5 },
          { key: 5, value: 8 },
          { key: 6, value: 13 },
          { key: 7, value: 21 },
        ],
      },
      linear: {
        title: "Linear",
        values: [
          { key: 1, value: 1 },
          { key: 2, value: 2 },
          { key: 3, value: 3 },
          { key: 4, value: 4 },
          { key: 5, value: 5 },
          { key: 6, value: 6 },
          { key: 7, value: 7 },
          { key: 8, value: 8 },
          { key: 9, value: 9 },
          { key: 10, value: 10 },
        ],
      },
      squares: {
        title: "Squares",
        values: [
          { key: 1, value: 1 },
          { key: 2, value: 4 },
          { key: 3, value: 9 },
          { key: 4, value: 16 },
          { key: 5, value: 25 },
          { key: 6, value: 36 },
        ],
      },
    },
    is_available: true,
  },
  categories: {
    name: "Categories",
    templates: {
      t_shirt_sizes: {
        title: "T-Shirt Sizes",
        values: [
          { key: 1, value: "XS" },
          { key: 2, value: "S" },
          { key: 3, value: "M" },
          { key: 4, value: "L" },
          { key: 5, value: "XL" },
          { key: 6, value: "XXL" },
        ],
      },
      easy_to_hard: {
        title: "Easy to hard",
        values: [
          { key: 1, value: "Easy" },
          { key: 2, value: "Medium" },
          { key: 3, value: "Hard" },
          { key: 4, value: "Very Hard" },
        ],
      },
    },
    is_available: true,
  },
  time: {
    name: "Time",
    templates: {
      hours: {
        title: "Hours",
        values: [
          { key: 1, value: 1 },
          { key: 2, value: 2 },
          { key: 3, value: 3 },
          { key: 4, value: 4 },
          { key: 5, value: 5 },
          { key: 6, value: 6 },
          { key: 7, value: 7 },
          { key: 8, value: 8 },
          { key: 9, value: 9 },
          { key: 10, value: 10 },
        ],
      },
    },
    is_available: false,
  },
};
