export const CHARTS_THEME = {
  background: "transparent",
  text: {
    color: "var(--text-color-secondary)",
  },
  axis: {
    domain: {
      line: {
        stroke: "var(--background-color-layer-2)",
        strokeWidth: 0.5,
      },
    },
  },
  tooltip: {
    container: {
      background: "var(--background-color-layer-2)",
      color: "var(--text-color-secondary)",
      fontSize: "0.8rem",
      border: "1px solid var(--border-color-strong)",
    },
  },
  grid: {
    line: {
      stroke: "var(--border-color-subtle)",
    },
  },
};

export const CHART_DEFAULT_MARGIN = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};
