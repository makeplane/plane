// nivo
import { Theme } from "@nivo/core";

export const CHARTS_THEME: Theme = {
  background: "rgb(var(--color-bg-surface-1))",
  textColor: "rgb(var(--color-text-secondary))",
  axis: {
    domain: {
      line: {
        stroke: "rgb(var(--color-border))",
        strokeWidth: 0.5,
      },
    },
  },
  tooltip: {
    container: {
      background: "rgb(var(--color-bg-surface-2))",
      color: "rgb(var(--color-text-secondary))",
      fontSize: "0.8rem",
      border: "1px solid rgb(var(--color-border))",
    },
  },
  grid: {
    line: {
      stroke: "rgb(var(--color-border))",
    },
  },
};

export const DEFAULT_MARGIN = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};
