// nivo
import { ResponsiveBar, BarSvgProps } from "@nivo/bar";
// helpers
import { CHARTS_THEME, DEFAULT_MARGIN } from "@/constants/graph";
import { generateYAxisTickValues } from "@/helpers/graph.helper";
// types
import { TGraph } from "./types";
// constants

type Props = {
  indexBy: string;
  keys: string[];
  customYAxisTickValues?: number[];
};

export const BarGraph: React.FC<Props & TGraph & Omit<BarSvgProps<any>, "height" | "width">> = ({
  indexBy,
  keys,
  customYAxisTickValues,
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
      padding={rest.padding ?? rest.data.length > 7 ? 0.8 : 0.9}
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
      enableLabel={rest.enableLabel ?? false}
      {...rest}
    />
  </div>
);
