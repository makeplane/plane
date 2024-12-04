import { startOfToday, format } from "date-fns";
import { TCycleProgress } from "@plane/types";

const renderScopeLabel = (data: TCycleProgress[], props: any) => {
  const { x, y, value } = props;
  const prevValue = data[props.index - 1]?.scope;
  const today = format(startOfToday(), "yyyy-MM-dd");

  return prevValue && prevValue !== value && data[props.index].date <= today ? (
    <g>
      <text
        x={x - 10}
        y={26}
        dy={-4}
        fill="#003FCC"
        fontSize={10}
        className="font-bold absolute top-0"
        textAnchor="start"
      >
        {prevValue < value ? <>&#9650; </> : <>&#9660; </>}
        {prevValue < value ? "+" : "-"}
        {`${Math.abs(value - prevValue)}`}
      </text>
      <line x1={x} y1={26} x2={x} y2={30} stroke="#003FCC" stroke-width="1" />
    </g>
  ) : (
    <></>
  );
};

const renderYAxisLabel = (props: any) => {
  const { x, y, value } = props;
  return <text fill={"#003FCC"} fontSize={10} className="font-bold" textAnchor="start" />;
};
export { renderScopeLabel, renderYAxisLabel };
