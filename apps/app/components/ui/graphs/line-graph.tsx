import { ResponsiveLine, Serie } from "@nivo/line";
import { LegendProps } from "@nivo/legends";
// types
import { TGraph } from "./types";
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

type Props = {
  data: Serie[];

  // line
  curve?:
    | "basis"
    | "cardinal"
    | "catmullRom"
    | "linear"
    | "monotoneX"
    | "monotoneY"
    | "natural"
    | "step"
    | "stepAfter"
    | "stepBefore";
  lineWidth?: number;

  // area
  enableArea?: boolean;
  /** A value between 0 and 1 */
  areaOpacity?: number;

  // points
  enablePoints?: boolean;
  pointSize?: number;

  // grid
  enableGridX?: boolean;
  enableGridY?: boolean;

  // mesh
  useMesh?: boolean;

  // legends
  legends?: LegendProps[];
} & TGraph;

export const LineGraph: React.FC<Props> = ({
  data,
  curve,
  lineWidth,
  enableArea,
  areaOpacity,
  enablePoints,
  pointSize,
  enableGridX,
  enableGridY,
  useMesh,
  legends,
  height = "400px",
  width = "100%",
  margin,
  theme,
}) => (
  <div style={{ height, width }}>
    <ResponsiveLine
      data={data}
      // line
      curve={curve}
      lineWidth={lineWidth}
      // area
      enableArea={enableArea}
      areaOpacity={areaOpacity}
      // points
      enablePoints={enablePoints}
      pointSize={pointSize}
      // grid
      enableGridX={enableGridX}
      enableGridY={enableGridY}
      // mesh
      useMesh={useMesh}
      margin={margin ?? DEFAULT_MARGIN}
      theme={theme ?? CHARTS_THEME}
      animate={true}
      legends={legends}
    />
  </div>
);
