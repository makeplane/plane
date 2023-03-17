import { useState } from "react";

// recharts
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
// ui
import { CustomMenu } from "components/ui";
// types
import { IIssue } from "types";
// constants
import { MONTHS } from "constants/project";

type Props = {
  issues: IIssue[] | undefined;
};

export const CompletedIssuesGraph: React.FC<Props> = ({ issues }) => {
  const [month, setMonth] = useState(new Date().getMonth());

  const weeks = month === 1 ? 4 : 5;

  const monthIssues =
    issues?.filter(
      (i) =>
        new Date(i.created_at).getMonth() === month &&
        new Date(i.created_at).getFullYear() === new Date().getFullYear()
    ) ?? [];

  const data: any[] = [];

  for (let j = 1; j <= weeks; j++) {
    const weekIssues = monthIssues.filter(
      (i) => i.completed_at && Math.ceil(new Date(i.completed_at).getDate() / 7) === j
    );

    data.push({ name: `Week ${j}`, completedIssues: weekIssues.length });
  }

  return (
    <div>
      <div className="mb-0.5 flex justify-between">
        <h3 className="font-semibold">Issues closed by you</h3>
        <CustomMenu label={<span className="text-sm">{MONTHS[month]}</span>} noBorder>
          {MONTHS.map((month, index) => (
            <CustomMenu.MenuItem key={month} onClick={() => setMonth(index)}>
              {month}
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </div>
      <div className="rounded-[10px] border bg-white p-8 pl-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid stroke="#e2e2e2" />
            <XAxis dataKey="name" />
            <YAxis dataKey="completedIssues" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="completedIssues"
              stroke="#d687ff"
              strokeWidth={3}
              fill="#8e2de2"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
