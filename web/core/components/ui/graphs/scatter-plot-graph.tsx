// nivo
import { ResponsiveScatterPlot, ScatterPlotSvgProps } from "@nivo/scatterplot";
// types
import { CHARTS_THEME, CHART_DEFAULT_MARGIN } from "@plane/constants";
import { TGraph } from "./types";
// constants

export const ScatterPlotGraph: React.FC<TGraph & Omit<ScatterPlotSvgProps<any>, "height" | "width">> = ({
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsiveScatterPlot
      margin={{ ...CHART_DEFAULT_MARGIN, ...(margin ?? {}) }}
      animate
      theme={{ ...CHARTS_THEME, ...(theme ?? {}) }}
      {...rest}
    />
  </div>
);
