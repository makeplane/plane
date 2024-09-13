const renderScopeLabel = (data, props: any) => {
  const { x, y, value } = props;
  const prevValue = data[props.index - 1]?.scope;

  return prevValue && prevValue !== value ? (
    <g>
      <text x={x} y={26} dy={-4} fill="#003FCC" fontSize={10} className="font-bold absolute top-0" textAnchor="end">
        {prevValue < value ? <>&#9650; </> : <>&#9660; </>}
        {prevValue < value ? "+" : "-"}
        {`${Math.abs(value - prevValue)}`}
      </text>
      <line x1={x - 10} y1={26} x2={x - 10} y2={30} stroke="#003FCC" stroke-width="1"></line>
    </g>
  ) : (
    <></>
  );
};

const renderYAxisLabel = (props: any) => {
  const { x, y, value } = props;
  return <text fill={"#003FCC"} fontSize={10} className="font-bold" textAnchor="start"></text>;
};
export { renderScopeLabel, renderYAxisLabel };
