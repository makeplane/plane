import React from "react";

// nivo
import { ResponsiveBar, BarDatum } from "@nivo/bar";
import { Theme, Margin } from "@nivo/core";
// constants
import { CHARTS_THEME } from "constants/themes";

type Props = {
  data: BarDatum[];
  indexBy: string;
  keys: string[];
  height?: string;
  width?: string;
  margin?: Partial<Margin>;
  colors?: { [key: string]: string };
  tooltip?: (datum: { id: string | number; value: number; color: string }) => JSX.Element;
  theme?: Theme;
  xTickValues?: number[];
  yTickValues?: number[];
};

export const BarGraph: React.FC<Props> = ({
  data,
  indexBy,
  keys,
  height = "400px",
  width = "100%",
  margin,
  colors,
  tooltip,
  xTickValues,
  yTickValues,
  theme,
}) => {
  const graphMargin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  };

  return (
    <div style={{ height, width }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={margin ?? graphMargin}
        padding={0.3}
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
};
