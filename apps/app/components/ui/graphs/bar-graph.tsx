// nivo
import { ResponsiveBar, BarSvgProps } from "@nivo/bar";
// types
import { TGraph } from "./types";
// constants
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

type Props = {
  indexBy: string;
  keys: string[];
};

export const BarGraph: React.FC<Props & TGraph & Omit<BarSvgProps<any>, "height" | "width">> = ({
  indexBy,
  keys,
  padding = 0.8,
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsiveBar
      indexBy={indexBy}
      keys={keys}
      margin={{ ...DEFAULT_MARGIN, ...(margin ?? {}) }}
      padding={padding}
      axisBottom={{
        tickSize: 0,
        tickPadding: 10,
        tickRotation: rest.data.length > 7 ? -45 : 0,
      }}
      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      theme={{ ...CHARTS_THEME, ...(theme ?? {}) }}
      animate={true}
      enableLabel={rest.enableLabel ?? false}
      {...rest}
    />
  </div>
);
