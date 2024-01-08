// nivo
import { ResponsiveMarimekko, SvgProps } from "@nivo/marimekko";
// helpers
import { generateYAxisTickValues } from "helpers/graph.helper";
// types
import { TGraph } from "./types";
// constants
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

type Props = {
  id: string;
  value: string;
  customYAxisTickValues?: number[];
};

export const MarimekkoGraph: React.FC<Props & TGraph & Omit<SvgProps<any>, "height" | "width">> = ({
  id,
  value,
  customYAxisTickValues,
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsiveMarimekko
      id={id}
      value={value}
      margin={{ ...DEFAULT_MARGIN, ...(margin ?? {}) }}
      innerPadding={rest.innerPadding ?? 4}
      axisLeft={{
        tickSize: 0,
        tickPadding: 10,
        tickValues: customYAxisTickValues ? generateYAxisTickValues(customYAxisTickValues) : undefined,
      }}
      axisBottom={{
        tickSize: 0,
        tickPadding: 10,
        tickRotation: rest.data.length > 7 ? -45 : 0,
      }}
      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      theme={{ ...CHARTS_THEME, ...(theme ?? {}) }}
      animate
      {...rest}
    />
  </div>
);
