import { startOfToday, format } from "date-fns";
import { TProgressChartData } from "@/helpers/cycle.helper";

type TProps = {
  x?: number;
  y?: number;
  payload?: any;
  data?: TProgressChartData;
  startDate?: string;
  endDate?: string;
  stroke?: string;
  text?: string;
};
const CustomizedXAxisTicks = (props: TProps) => {
  const { x, y, payload, data, endDate, startDate, stroke, text } = props;
  if (data === undefined || endDate === undefined) return null;
  const [year, month, day] = payload.value.split("-");
  const monthName = new Date(payload.value).toLocaleString("default", { month: "short" });
  return (
    <g transform={`translate(${x},${y})`}>
      {(((day === "01" || payload.value === startDate) &&
        startDate &&
        payload.value !== format(startOfToday(), "yyyy-MM-dd")) ||
        payload.value === endDate) && (
        <>
          <line x1={"0"} y1="-8" x2="0" y2="0" stroke={stroke} stroke-width="1" />
          <text
            x={day === "01" || payload.index === 0 ? "-10" : "-5"}
            y={0}
            dy={12}
            textAnchor={payload.index === data.length - 1 ? "end" : "start"}
            fill={text}
            style={{ fontSize: "10px" }}
          >
            {(day === "01" || payload.index === 0) && monthName} {day}
            {day === "01" && <>&#8594;</>}
          </text>
          {(payload.value === startDate || payload.value === endDate) && (
            <text
              x={-8}
              y={12}
              dy={16}
              textAnchor={payload.index === data.length - 1 ? "end" : "start"}
              fill={text}
              style={{ fontSize: "10px" }}
            >
              {payload.value === startDate ? "Start" : "End"}
            </text>
          )}
        </>
      )}
      {payload.value === format(startOfToday(), "yyyy-MM-dd") && payload.value < endDate && (
        <>
          <line x1="0" y1="-8" x2="0" y2="0" stroke={stroke} stroke-width="1" />
          <text x={0} y={0} dy={12} textAnchor={"middle"} fill={text} style={{ fontSize: "10px" }}>
            {day}
          </text>
          {(payload.value === startDate || payload.value === endDate) && (
            <text
              x={-12}
              y={8}
              dy={16}
              textAnchor={payload.index === data.length - 1 ? "end" : "start"}
              fill={text}
              style={{ fontSize: "10px" }}
            >
              {payload.value === startDate ? "Start" : "End"}
            </text>
          )}
          <svg
            x={-17}
            y={payload.value === startDate || payload.value === endDate ? 30 : 18}
            dy={payload.value === startDate || payload.value === endDate ? 30 : 18}
            width="34"
            height="16px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect rx="2" width="100%" height="100%" fill="#667699" />
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10px">
              Today
            </text>
          </svg>
        </>
      )}
    </g>
  );
};
const CustomizedYAxisTicks = (props: TProps) => {
  const { x, y, payload, text } = props;
  if (x === undefined || y === undefined || payload === undefined) return null;
  return (
    <text x={x - 10} y={y} dy={3} textAnchor="middle" fill={text} style={{ fontSize: "10px" }}>
      {payload.value}
    </text>
  );
};

export { CustomizedXAxisTicks, CustomizedYAxisTicks };
