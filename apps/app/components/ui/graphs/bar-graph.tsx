// nivo
import { BarDatum, ResponsiveBar } from "@nivo/bar";
// types
import { TGraph } from "./types";
// constants
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

type Props = {
  data: BarDatum[];
  indexBy: string;
  keys: string[];
  padding?: number;
  colors?: { [key: string]: string };
  xTickValues?: number[];
  yTickValues?: number[];
} & TGraph;

export const BarGraph: React.FC<Props> = ({
  data,
  indexBy,
  keys,
  padding = 0.3,
  height = "400px",
  width = "100%",
  margin,
  colors,
  tooltip,
  xTickValues,
  yTickValues,
  theme,
}) => (
  <div style={{ height, width }}>
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      margin={margin ?? DEFAULT_MARGIN}
      padding={padding}
      axisBottom={{
        tickValues: xTickValues,
      }}
      axisLeft={{
        tickValues: yTickValues,
      }}
      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      theme={theme ?? CHARTS_THEME}
      animate={true}
      colors={colors ? (datum) => colors[datum.id] : undefined}
      tooltip={tooltip ?? undefined}
    />
  </div>
);
