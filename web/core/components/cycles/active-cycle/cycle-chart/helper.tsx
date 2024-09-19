import { getToday } from "@/helpers/date-time.helper";
import { TCycleProgress } from "@plane/types";

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
export const maxScope = (data: TCycleProgress[]) => Math.max(...data.map((d) => d.scope || 0));

const generateDateArray = (startDate: Date, endDate: Date) => {
  // Convert the start and end dates to Date objects if they aren't already
  let start = new Date(startDate);
  // start.setDate(start.getDate() + 1);
  let end = new Date(endDate);
  end.setDate(end.getDate() + 1);

  // Create an empty array to store the dates
  let dateArray = [];

  // Use a while loop to generate dates between the range
  while (start <= end) {
    // Increment the date by 1 day (86400000 milliseconds)
    start.setDate(start.getDate() + 1);
    // Push the current date (converted to ISO string for consistency)
    dateArray.push({
      date: new Date(start).toISOString().split("T")[0],
    });
  }

  return dateArray;
};

export const chartHelper = (data: TCycleProgress[], endDate: Date) => {
  // Get today's date
  const today = getToday();
  const scopeToday = data[data.length - 1].scope;
  const idealToday = data[data.length - 1].ideal;
  const extendedArray = generateDateArray(today as Date, endDate);

  // add `range` to data for Area
  const dataWithRange = [...data, ...extendedArray].map((d: Partial<TCycleProgress>) => {
    return {
      ...d,
      range: d.actual !== undefined && d.ideal !== undefined ? [d.actual, d.ideal] : [],
      timeLeft: new Date(d.date!) < today ? [] : [0, maxScope(data)],
      ideal: new Date(d.date!) < today ? d.ideal : endDate >= new Date(d.date!) ? idealToday : null,
      scope: new Date(d.date!) < today ? d.scope : endDate >= new Date(d.date!) ? scopeToday : null,
      beyondTime: endDate <= new Date(d.date!) ? [0, maxScope(data)] : [],
    };
  });

  // need to find intersections as points where we to change fill color
  const intersections = data
    .map((d, i: number) => intersect(i, d.actual, i + 1, data[i + 1]?.actual, i, d.ideal, i + 1, data[i + 1]?.ideal))
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

      const offset = intersection.x / (data.filter((d) => d.actual !== undefined && d.ideal !== undefined).length - 1);
      return (
        <>
          <stop offset={offset} stopColor={closeColor} stopOpacity={0.9} />
          <stop offset={offset} stopColor={startColor} stopOpacity={0.9} />
        </>
      );
    })
  ) : (
    <stop offset={0} stopColor={data[0].actual > data[0].ideal ? "red" : "blue"} />
  );

  return { diffGradient, dataWithRange };
};
