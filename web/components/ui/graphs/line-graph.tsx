// nivo
import { ResponsiveLine, LineSvgProps } from "@nivo/line";
// helpers
import { generateYAxisTickValues } from "helpers/graph.helper";
// types
import { TGraph } from "./types";
// constants
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

type Props = {
  customYAxisTickValues?: number[];
};

export const LineGraph: React.FC<Props & TGraph & LineSvgProps> = ({
  customYAxisTickValues,
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsiveLine
      margin={{ ...DEFAULT_MARGIN, ...(margin ?? {}) }}
      axisLeft={{
        tickSize: 0,
        tickPadding: 10,
        tickValues: customYAxisTickValues ? generateYAxisTickValues(customYAxisTickValues) : undefined,
      }}
      theme={{ ...CHARTS_THEME, ...(theme ?? {}) }}
      animate
      {...rest}
    />
  </div>
);
