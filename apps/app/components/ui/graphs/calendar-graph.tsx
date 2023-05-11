// nivo
import { ResponsiveCalendar, CalendarSvgProps } from "@nivo/calendar";
// types
import { TGraph } from "./types";
// constants
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

export const CalendarGraph: React.FC<TGraph & Omit<CalendarSvgProps, "height" | "width">> = ({
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsiveCalendar
      margin={margin ?? DEFAULT_MARGIN}
      colors={
        rest.colors ?? [
          "rgba(var(--color-accent), 0.2)",
          "rgba(var(--color-accent), 0.4)",
          "rgba(var(--color-accent), 0.8)",
          "rgba(var(--color-accent), 1)",
        ]
      }
      emptyColor={rest.emptyColor ?? "rgb(var(--color-bg-surface-2))"}
      dayBorderColor={rest.dayBorderColor ?? "transparent"}
      daySpacing={rest.daySpacing ?? 5}
      monthBorderColor={rest.monthBorderColor ?? "rgb(var(--color-bg-base))"}
      theme={theme ?? CHARTS_THEME}
      {...rest}
    />
  </div>
);
