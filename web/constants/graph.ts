// nivo
import { Theme } from "@nivo/core";

export const CHARTS_THEME: Theme = {
  background: "transparent",
  textColor: "var(--color-neutral-110)",
  axis: {
    domain: {
      line: {
        stroke: "var(--color-background-80)",
        strokeWidth: 0.5,
      },
    },
  },
  tooltip: {
    container: {
      background: "var(--color-background-80)",
      color: "var(--color-neutral-110)",
      fontSize: "0.8rem",
      border: "1px solid var(--color-neutral-70)",
    },
  },
  grid: {
    line: {
      stroke: "var(--color-neutral-60)",
    },
  },
};

export const DEFAULT_MARGIN = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};
