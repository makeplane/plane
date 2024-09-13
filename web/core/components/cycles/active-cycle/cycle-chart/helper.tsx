import { getToday } from "@/helpers/date-time.helper";

export const data = [
  { month: "2024-08-30", started: 0, pending: 70, ideal: 70, scope: 95 },
  { month: "2024-09-01", started: 0, pending: 70, ideal: 70, scope: 95 },
  { month: "2024-09-02", started: 11, pending: 42, ideal: 49, scope: 95 },
  { month: "2024-09-03", started: 12, pending: 51, ideal: 47, scope: 95 },
  { month: "2024-09-04", started: 13, pending: 45, ideal: 46, scope: 95 },
  { month: "2024-09-05", started: 14, pending: 46, ideal: 44, scope: 87 },
  { month: "2024-09-06", started: 15, pending: 42, ideal: 43, scope: 87 },
  { month: "2024-09-07", started: 16, pending: 44, ideal: 42, scope: 87 },
  { month: "2024-09-08", started: 17, pending: 41, ideal: 41, scope: 91 },
  { month: "2024-09-09", started: 17, pending: 42, ideal: 39, scope: 91 },
  { month: "2024-09-10", started: 19, pending: 38, ideal: 38, scope: 91 },
  { month: "2024-09-11", started: 20, pending: 37, ideal: 37, scope: 91 },
  { month: "2024-09-12", started: 21, pending: 36, ideal: 36, scope: 90 },

  // After 12th September: started and pending undefined, scope constant at 90
  { month: "2024-09-13", started: 21, pending: 36, ideal: 36, scope: 90 },
  { month: "2024-09-14", started: undefined, pending: undefined, ideal: 33, scope: 90 },
  { month: "2024-09-15", started: undefined, pending: undefined, ideal: 32, scope: 90 },
  { month: "2024-09-16", started: undefined, pending: undefined, ideal: 31, scope: 90 },
  { month: "2024-09-17", started: undefined, pending: undefined, ideal: 30, scope: 90 },
  { month: "2024-09-18", started: undefined, pending: undefined, ideal: 29, scope: 90 },
  { month: "2024-09-19", started: undefined, pending: undefined, ideal: 28, scope: 90 },
  { month: "2024-09-20", started: undefined, pending: undefined, ideal: 27, scope: 90 },
  { month: "2024-09-21", started: undefined, pending: undefined, ideal: 26, scope: 90 },
  { month: "2024-09-22", started: undefined, pending: undefined, ideal: 25, scope: 90 },
  { month: "2024-09-23", started: undefined, pending: undefined, ideal: 24, scope: 90 },
  { month: "2024-09-24", started: undefined, pending: undefined, ideal: 23, scope: 90 },
  { month: "2024-09-25", started: undefined, pending: undefined, ideal: 22, scope: 90 },
  { month: "2024-09-26", started: undefined, pending: undefined, ideal: 21, scope: 90 },
  { month: "2024-09-27", started: undefined, pending: undefined, ideal: 20, scope: 90 },
  { month: "2024-09-28", started: undefined, pending: undefined, ideal: 19, scope: 90 },
  { month: "2024-09-29", started: undefined, pending: undefined, ideal: 19, scope: 90 },
  { month: "2024-09-30", started: undefined, pending: undefined, ideal: undefined, scope: undefined },

  // { month: "2024-10-01", started: undefined, pending: 17, ideal: 16, scope: 90 },
];

// { month: "X", started: undefined, pending: undefined, ideal: undefined, scope: undefined },

const getIntersectionColor = (_intersection, isLast = false) => {
  if (isLast) {
    return _intersection.line1isHigherNext ? "#FFE5E5" : "#D4F7DC";
  }

  return _intersection.line1isHigher ? "#FFE5E5" : "#D4F7DC";
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

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);

  const line1isHigher = y1 > y3;
  const line1isHigherNext = y2 > y4;

  return { x, y, line1isHigher, line1isHigherNext };
};
export const maxScope = Math.max(...data.map((d) => d.scope || 0));
export const chartHelper = (data) => {
  // Get today's date
  const today = getToday();
  const endDate = "2024-09-29";

  // add `range` to data for Area
  const dataWithRange = data.map((d, i: number) => {
    return {
      ...d,
      range: d.pending !== undefined && d.ideal !== undefined ? [d.pending, d.ideal] : [],
      timeLeft: new Date(d.month) < today || i === data.length - 1 ? [] : [0, maxScope],
      beyondTime: new Date(endDate) <= new Date(d.month) ? [0, maxScope] : [],
    };
  });

  // need to find intersections as points where we to change fill color
  const intersections = data
    .map((d, i: number) => intersect(i, d.pending, i + 1, data[i + 1]?.pending, i, d.ideal, i + 1, data[i + 1]?.ideal))
    .filter((d) => d && !isNaN(d.x));

  // filtering out segments without intersections & duplicates (in case end current 2 segments are also
  // start of 2 next segments)
  const filteredIntersections = intersections.filter(
    (d, i: number) => i === intersections.length - 1 || d.x !== intersections[i - 1]?.x
  );

  const diffGradient = filteredIntersections.length ? (
    filteredIntersections.map((intersection, i: number) => {
      const nextIntersection = filteredIntersections[i + 1];

      let closeColor = "";
      let startColor = "";

      const isLast = i === filteredIntersections.length - 1;

      if (isLast) {
        closeColor = getIntersectionColor(intersection);
        startColor = getIntersectionColor(intersection, true);
      } else {
        closeColor = getIntersectionColor(intersection);
        startColor = getIntersectionColor(nextIntersection);
      }

      const offset = intersection.x / (data.filter((d) => d.pending !== undefined && d.ideal !== undefined).length - 1);
      return (
        <>
          <stop offset={offset} stopColor={closeColor} stopOpacity={0.9} />
          <stop offset={offset} stopColor={startColor} stopOpacity={0.9} />
        </>
      );
    })
  ) : (
    <stop offset={0} stopColor={data[0].pending > data[0].ideal ? "red" : "blue"} />
  );

  return { diffGradient, dataWithRange };
};
