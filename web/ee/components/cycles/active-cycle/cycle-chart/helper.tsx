import { startOfToday } from "date-fns";
import { TCycleProgress } from "@plane/types";
import { TProgressChartData } from "@/helpers/cycle.helper";

type TIntersection = { x: number; y: number; line1isHigher: boolean; line1isHigherNext: boolean };

export const getColors = (resolvedTheme: string | undefined) => {
  if (resolvedTheme?.includes("dark"))
    return {
      cartesianLines: "#212631",
      axisLines: "#3D475C",
      axisText: "#667699",
      timeLeft: "#000D29",
      timeLeftStroke: "#212631",
      beyondTime: "#330000",
      beyondTimeStroke: "#990000",
      idealStroke: "#001F66",
      diffRed: "#1A0000",
      diffGreen: "#082B10",
      startedStroke: "#FFD500",
      startedArea: "#FFAA33",
      todayLine: "#C8CEDA",
      scopeStroke: "#004EFF",
      scopeArea: "#3E63DD",
      actual: "#26D950",
    };
  else
    return {
      cartesianLines: "#f5f5f5",
      axisLines: "#C2C8D6",
      axisText: "#666",
      timeLeft: "#E0EAFF",
      timeLeftStroke: "#E0EAFF",
      beyondTime: "#FFE5E5",
      beyondTimeStroke: "#FF9999",
      idealStroke: "#B8CEFF",
      diffRed: "#FFE5E5",
      diffGreen: "#D4F7DC",
      startedStroke: "#FF9500",
      startedArea: "#FF9500",
      todayLine: "black",
      scopeStroke: "rgba(var(--color-primary-100))",
      scopeArea: "rgba(var(--color-primary-100))",
      actual: "#26D950",
    };
};

const getIntersectionColor = (
  _intersection: TIntersection | boolean,
  colors: { diffGreen: string; diffRed: string },
  plotType: string,
  isLast = false
) => {
  const isLineHigher = isLast
    ? (_intersection as TIntersection).line1isHigherNext
    : (_intersection as TIntersection).line1isHigher;
  return isLineHigher
    ? plotType === "burndown"
      ? colors.diffRed
      : colors.diffGreen
    : plotType === "burnup"
      ? colors.diffRed
      : colors.diffGreen;
};

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
const intersect = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel
  if (denominator === 0) {
    return false;
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }

  // Return a object with the x and y coordinates of the intersection
  const x = x1 + ua * (x2 - x1);
  const y = y1 + ua * (y2 - y1);

  const line1isHigher = y1 > y3;
  const line1isHigherNext = y2 > y4;

  return { x, y, line1isHigher, line1isHigherNext };
};
export const maxScope = (data: TProgressChartData) => Math.max(...data.map((d) => d.scope || 0));

export const chartHelper = (
  data: TProgressChartData,
  endDate: Date,
  plotType: string,
  colors: { diffGreen: string; diffRed: string }
) => {
  // Get today's date
  const today = startOfToday();

  // add `range` to data for Area
  const dataWithRange = [...data].map((d: Partial<TCycleProgress>) => ({
    ...d,
    range: d.actual !== undefined ? [d.actual, d.ideal] : [],
    timeLeft: new Date(d.date!) < today || new Date(d.date!) > endDate ? [] : [0, Math.max(maxScope(data), 2)],
    beyondTime: endDate <= new Date(d.date!) ? [0, Math.max(maxScope(data), 2)] : [],
  }));

  // need to find intersections as points where we to change fill color
  const intersections = data
    .map((d, i: number) => intersect(i, d.actual, i + 1, data[i + 1]?.actual, i, d.ideal, i + 1, data[i + 1]?.ideal))
    .filter((d) => d && !isNaN(d.x));

  // filtering out segments without intersections & duplicates (in case end current 2 segments are also
  // start of 2 next segments)
  const filteredIntersections = intersections.filter(
    (d: TIntersection | false, i: number) =>
      i === intersections.length - 1 || (d as TIntersection).x !== (intersections[i - 1] as TIntersection)?.x
  );

  const isAhead =
    (plotType === "burndown" && data[0]?.actual < data[0]?.ideal) ||
    (plotType === "burnup" && data[0]?.actual > data[0]?.ideal);

  const diffGradient = filteredIntersections.length ? (
    filteredIntersections.map((intersection, i: number) => {
      const nextIntersection = filteredIntersections[i + 1];

      let closeColor = "";
      let startColor = "";

      const isLast = i === filteredIntersections.length - 1;

      if (isLast) {
        closeColor = getIntersectionColor(intersection, colors, plotType);
        startColor = getIntersectionColor(intersection, colors, plotType, true);
      } else {
        closeColor = getIntersectionColor(intersection, colors, plotType);
        startColor = getIntersectionColor(nextIntersection, colors, plotType);
      }

      const offset =
        (intersection as TIntersection).x /
        (data.filter((d) => d.actual !== undefined && d.ideal !== undefined).length - 1);
      return (
        <>
          <stop offset={offset} stopColor={closeColor} stopOpacity={0.9} />
          <stop offset={offset} stopColor={startColor} stopOpacity={0.9} />
        </>
      );
    })
  ) : (
    <stop offset={0} stopColor={isAhead ? colors.diffGreen : colors.diffRed} />
  );

  return { diffGradient, dataWithRange };
};
