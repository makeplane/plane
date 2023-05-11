// nivo
import { ResponsiveLine, LineSvgProps } from "@nivo/line";
// types
import { TGraph } from "./types";
// constants
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

export const LineGraph: React.FC<TGraph & LineSvgProps> = ({
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsiveLine
      margin={{ ...DEFAULT_MARGIN, ...(margin ?? {}) }}
      theme={{ ...CHARTS_THEME, ...(theme ?? {}) }}
      animate={true}
      {...rest}
    />
  </div>
);
