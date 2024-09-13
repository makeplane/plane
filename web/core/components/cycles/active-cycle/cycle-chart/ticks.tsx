import { getToday } from "@/helpers/date-time.helper";

const CustomizedXAxisTicks = (props) => {
  const { x, y, payload, data } = props;
  const [year, month, day] = payload.value.split("-");
  const monthName = new Date(payload.value).toLocaleString("default", { month: "short" });
  const endDate = "2024-09-29";
  return (
    <g transform={`translate(${x},${y})`}>
      {(day === "01" || payload.index === 0 || payload.value === endDate) && (
        <>
          <line x1="0" y1="-8" x2="0" y2="0" stroke="#C2C8D6" stroke-width="1"></line>
          <text
            x={0}
            y={0}
            dy={12}
            textAnchor={payload.index === data.length - 1 ? "end" : "start"}
            fill="#666"
            style={{ fontSize: "10px" }}
          >
            {day === "01" && monthName} {day} {day === "01" && <>&#8594;</>}
          </text>
          {(payload.index === 0 || payload.value === endDate) && (
            <text
              x={0}
              y={12}
              dy={16}
              textAnchor={payload.index === data.length - 1 ? "end" : "start"}
              fill="#666"
              style={{ fontSize: "10px" }}
            >
              {payload.index === 0 ? "Start" : "End"}
            </text>
          )}
        </>
      )}
      {payload.value === getToday(true) && (
        <>
          <line x1="0" y1="-8" x2="0" y2="0" stroke="#C2C8D6" stroke-width="1"></line>
          <text x={0} y={0} dy={12} textAnchor={"middle"} fill="#666" style={{ fontSize: "10px" }}>
            {day}
          </text>
          <svg x={-17} y={18} dy={18} width="34" height="16px" xmlns="http://www.w3.org/2000/svg">
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
const CustomizedYAxisTicks = (props) => {
  const { x, y, payload } = props;
  return (
    <text x={x - 10} y={y} dy={3} textAnchor="middle" fill="#666" style={{ fontSize: "10px" }}>
      {payload.value}
    </text>
  );
};

export { CustomizedXAxisTicks, CustomizedYAxisTicks };
