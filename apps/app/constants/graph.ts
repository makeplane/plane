// nivo
import { Theme } from "@nivo/core";
import { BarDatum } from "@nivo/bar";

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

export const DEFAULT_MARGIN = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};

export const convertPayloadToBarGraphData = (payload: any, segmented: boolean) => {
  if (!payload || !(typeof payload === "object") || Object.keys(payload).length === 0) return [];

  const data: BarDatum[] = [];

  Object.keys(payload).forEach((key) => {
    if (segmented) {
      const segments: { [key: string]: number } = {};

      payload[key].map((item: any) => {
        segments[item.segment] = item.count;
      });

      data.push({
        name: key,
        ...segments,
      });
    } else {
      const item = payload[key][0];

      data.push({
        name: item.date,
        count: item.count,
      });
    }
  });

  return data;
};

export const convertPayloadToScatterGraphData = (payload: any) => {};
