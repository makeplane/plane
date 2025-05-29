import { startOfToday, format, differenceInWeeks } from "date-fns";
import { TCycleProgress } from "@plane/types";
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
  showToday?: boolean;
  showAllTicks?: boolean;
};

const Today = (props: any) => {
  const { dy } = props;
  return (
    <svg x={-17} y={dy} dy={dy} width="34" height="16px" xmlns="http://www.w3.org/2000/svg">
      <rect rx="2" width="100%" height="100%" fill="#667699" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10px">
        Today
      </text>
    </svg>
  );
};
const CustomizedXAxisTicks = (props: TProps) => {
  const { x, y, payload, data, endDate, startDate, stroke, text, showToday, showAllTicks } = props;
  const [year, month, day] = payload.value.split("-");
  const monthName = new Date(payload.value).toLocaleString("default", { month: "short" });
  const isStart = payload.value === startDate;
  const isEnd = payload.value === endDate;
  const isToday = payload.value === format(startOfToday(), "yyyy-MM-dd");
  const weeks = endDate && startDate ? differenceInWeeks(endDate, startDate) : 4;

  if (!data || !endDate) return null;

  const shouldShowTick = (payload: Partial<TCycleProgress>) => {
    if (!payload) return false;

    const today = format(startOfToday(), "yyyy-MM-dd");
    const yesterday = format(new Date(today).setDate(new Date(today).getDate() - 1), "yyyy-MM-dd");
    const tomorrow = format(new Date(today).setDate(new Date(today).getDate() + 1), "yyyy-MM-dd");

    if (payload.date === startDate || payload.date === endDate) return true;
    if (
      payload.date === format(startOfToday(), "yyyy-MM-dd") &&
      payload.date < endDate &&
      yesterday !== startDate &&
      tomorrow !== endDate
    )
      return true;
    return false;
  };

  const areAdjacentTicksVisible = (payload: any) => {
    const prev = data[payload.index - 1];
    const next = data[payload.index + 1];
    return shouldShowTick(prev) || shouldShowTick(next);
  };

  const shouldShowThisTick = () =>
    (data.length < 10 && showAllTicks) ||
    (payload.index !== 0 &&
      payload.index % (weeks * 2 - 1) === 0 &&
      !areAdjacentTicksVisible(payload) &&
      showAllTicks) ||
    shouldShowTick(data[payload.index]);

  if (!shouldShowThisTick()) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={"0"} y1="-8" x2="0" y2="0" stroke={stroke} stroke-width="1" />
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor={payload.index === data.length - 1 ? "end" : "middle"}
        fill={text}
        style={{ fontSize: "10px", fontWeight: isToday ? "bold" : "normal" }}
      >
        {monthName} {day}
      </text>
      <>
        {(isStart || isEnd) && (
          <text
            x={isEnd ? "0" : isToday ? "-10" : payload.index === 0 ? "-10" : "-5"}
            y={10}
            dy={16}
            textAnchor={payload.index === data.length - 1 ? "end" : "start"}
            fill={text}
            style={{ fontSize: "10px" }}
          >
            {isStart ? "Start" : "End"}
          </text>
        )}
      </>
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
