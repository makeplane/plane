// nivo
import { ResponsiveScatterPlot, ScatterPlotSvgProps } from "@nivo/scatterplot";
// types
import { TGraph } from "./types";
// constants
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

export const ScatterPlotGraph: React.FC<
  TGraph & Omit<ScatterPlotSvgProps<any>, "height" | "width">
> = ({ height = "400px", width = "100%", margin, theme, ...rest }) => (
  <div style={{ height, width }}>
    <ResponsiveScatterPlot
      margin={margin ?? DEFAULT_MARGIN}
      animate={true}
      theme={theme ?? CHARTS_THEME}
      {...rest}
    />
  </div>
);
