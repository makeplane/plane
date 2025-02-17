// nivo
import { PieSvgProps, ResponsivePie } from "@nivo/pie";
// types
import { CHARTS_THEME, CHART_DEFAULT_MARGIN } from "@plane/constants";
import { TGraph } from "./types";
// constants

export const PieGraph: React.FC<TGraph & Omit<PieSvgProps<any>, "height" | "width">> = ({
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsivePie
      margin={{ ...CHART_DEFAULT_MARGIN, ...(margin ?? {}) }}
      theme={{ ...CHARTS_THEME, ...(theme ?? {}) }}
      animate
      {...rest}
    />
  </div>
);
