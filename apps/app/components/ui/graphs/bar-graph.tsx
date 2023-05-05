// nivo
import { ResponsiveBar, BarSvgProps } from "@nivo/bar";
// types
import { TGraph } from "./types";
// constants
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

export const BarGraph: React.FC<TGraph & Omit<BarSvgProps<any>, "height" | "width">> = ({
  padding = 0.3,
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsiveBar
      margin={margin ?? DEFAULT_MARGIN}
      padding={padding}
      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      theme={theme ?? CHARTS_THEME}
      animate={true}
      {...rest}
    />
  </div>
);
