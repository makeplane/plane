// nivo
import { ResponsivePie } from "@nivo/pie";
import { PropertyAccessor } from "@nivo/core";
import { LegendProps } from "@nivo/legends";
// types
import { TGraph } from "./types";
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

type Props = {
  data: any[];
  /** A value between 0 and 1 */
  innerRadius?: number;

  // labels
  enableArcLinkLabels?: boolean;
  arcLinkLabel?: PropertyAccessor<any, string>;
  enableArcLabels?: boolean;
  arcLabel?: PropertyAccessor<any, string>;

  // legends
  legends?: LegendProps[];
} & TGraph;

export const PieGraph: React.FC<Props> = ({
  data,
  innerRadius,
  enableArcLinkLabels = true,
  arcLinkLabel,
  enableArcLabels = true,
  arcLabel,
  legends,
  height = "400px",
  width = "100%",
  margin,
  colors,
  tooltip,
  theme,
}) => (
  <div style={{ height, width }}>
    <ResponsivePie
      data={data}
      margin={margin ?? DEFAULT_MARGIN}
      theme={theme ?? CHARTS_THEME}
      animate={true}
      innerRadius={innerRadius}
      enableArcLinkLabels={enableArcLinkLabels}
      arcLinkLabel={arcLinkLabel}
      enableArcLabels={enableArcLabels}
      arcLabel={arcLabel}
      colors={colors ? (datum) => colors[datum.id] : undefined}
      tooltip={tooltip ? (datum) => tooltip(datum.datum) : undefined}
      legends={legends}
    />
  </div>
);
