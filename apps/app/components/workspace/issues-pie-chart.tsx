import { useCallback, useState } from "react";

// recharts
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
// types
import { IUserStateDistribution } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

type Props = {
  groupedIssues: IUserStateDistribution[] | undefined;
};

export const IssuesPieChart: React.FC<Props> = ({ groupedIssues }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback(
    (_: any, index: number) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  const renderActiveShape = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text x={cx} y={cy} dy={8} className="capitalize" textAnchor="middle" fill={fill}>
          {payload.state_group}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
          {value} issues
        </text>
      </g>
    );
  };

  return (
    <div>
      <h3 className="mb-2 font-semibold">Issues by States</h3>
      <div className="rounded-[10px] border bg-white p-4">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={groupedIssues}
              dataKey="state_count"
              nameKey="state_group"
              cx="50%"
              cy="50%"
              fill="#8884d8"
              innerRadius={70}
              outerRadius={90}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
            >
              {groupedIssues?.map((cell) => (
                <Cell
                  key={cell.state_group}
                  fill={STATE_GROUP_COLORS[cell.state_group.toLowerCase()]}
                />
              ))}
            </Pie>
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              height={36}
              payload={[
                { value: "Backlog", type: "square", color: STATE_GROUP_COLORS.backlog },
                { value: "Unstarted", type: "square", color: STATE_GROUP_COLORS.unstarted },
                { value: "Started", type: "square", color: STATE_GROUP_COLORS.started },
                { value: "Completed", type: "square", color: STATE_GROUP_COLORS.completed },
                { value: "Cancelled", type: "square", color: STATE_GROUP_COLORS.cancelled },
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
