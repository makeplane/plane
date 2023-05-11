<<<<<<< HEAD
// nivo
import { Theme } from "@nivo/core";

export const CHARTS_THEME: Theme = {
  background: "rgb(var(--color-bg-surface-1))",
  textColor: "rgb(var(--color-text-secondary))",
  axis: {
    domain: {
      line: {
        stroke: "rgb(var(--color-border))",
=======
import { Theme } from "@nivo/core";

export const CHARTS_THEME: Theme = {
  background: "rgb(var(--color-bg-base))",
  textColor: "rgb(var(--color-text-base))",
  axis: {
    domain: {
      line: {
        stroke: "rgb(var(--color-text-base))",
>>>>>>> d7928f853d08f9957c90fe58f5b183c662bc346c
        strokeWidth: 0.5,
      },
    },
  },
  tooltip: {
    container: {
      background: "rgb(var(--color-bg-surface-2))",
      color: "rgb(var(--color-text-secondary))",
      fontSize: "0.8rem",
<<<<<<< HEAD
      border: "1px solid rgb(var(--color-border))",
=======
>>>>>>> d7928f853d08f9957c90fe58f5b183c662bc346c
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
