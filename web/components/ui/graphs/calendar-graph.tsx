// nivo
import { ResponsiveCalendar, CalendarSvgProps } from "@nivo/calendar";
// types
import { CHARTS_THEME, DEFAULT_MARGIN } from "@/constants/graph";
import { TGraph } from "./types";
// constants

export const CalendarGraph: React.FC<TGraph & Omit<CalendarSvgProps, "height" | "width">> = ({
  height = "400px",
  width = "100%",
  margin,
  theme,
  ...rest
}) => (
  <div style={{ height, width }}>
    <ResponsiveCalendar
      margin={{ ...DEFAULT_MARGIN, ...(margin ?? {}) }}
      colors={
        rest.colors ?? [
          "rgba(var(--color-primary-100), 0.2)",
          "rgba(var(--color-primary-100), 0.4)",
          "rgba(var(--color-primary-100), 0.8)",
          "rgba(var(--color-primary-100), 1)",
        ]
      }
      emptyColor={rest.emptyColor ?? "rgb(var(--color-background-80))"}
      dayBorderColor={rest.dayBorderColor ?? "transparent"}
      daySpacing={rest.daySpacing ?? 5}
      monthBorderColor={rest.monthBorderColor ?? "rgb(var(--color-background-100))"}
      theme={{ ...CHARTS_THEME, ...(theme ?? {}) }}
      {...rest}
    />
  </div>
);
