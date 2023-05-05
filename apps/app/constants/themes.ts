import { Theme } from "@nivo/core";

export const THEMES = [
  "light",
  "dark",
  "light-contrast",
  "dark-contrast",
  // "custom"
];

export const THEMES_OBJ = [
  {
    value: "light",
    label: "Light",
    type: "light",
  },
  {
    value: "dark",
    label: "Dark",
    type: "dark",
  },
  {
    value: "light-contrast",
    label: "Light High Contrast",
    type: "light",
  },
  {
    value: "dark-contrast",
    label: "Dark High Contrast",
    type: "dark",
  },
  // {
  //   value: "custom",
  //   label: "Custom",
  //   type: "light",
  // },
];

export const CHARTS_THEME: Theme = {
  background: "rgb(var(--color-bg-base))",
  textColor: "rgb(var(--color-text-base))",
  axis: {
    domain: {
      line: {
        stroke: "rgb(var(--color-text-base))",
        strokeWidth: 0.5,
      },
    },
  },
  tooltip: {
    container: {
      background: "rgb(var(--color-bg-surface-2))",
      color: "rgb(var(--color-text-secondary))",
      fontSize: "0.8rem",
    },
  },
  grid: {
    line: {
      stroke: "rgb(var(--color-border))",
    },
  },
};
