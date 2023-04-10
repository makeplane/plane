// recharts
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
// ui
import { CustomMenu } from "components/ui";
// constants
import { MONTHS } from "constants/project";

type Props = {
  issues:
    | {
        week_in_month: number;
        completed_count: number;
      }[]
    | undefined;
  month: number;
  setMonth: React.Dispatch<React.SetStateAction<number>>;
};

export const CompletedIssuesGraph: React.FC<Props> = ({ month, issues, setMonth }) => {
  const weeks = month === 2 ? 4 : 5;

  const data: any[] = [];

  for (let i = 1; i <= weeks; i++) {
    data.push({
      week_in_month: `Week ${i}`,
      completed_count: issues?.find((item) => item.week_in_month === i)?.completed_count ?? 0,
    });
  }

  const CustomTooltip = ({ payload, label }: any) => (
    <div className="space-y-1 rounded bg-brand-surface-1 p-3 text-sm shadow-md">
      <h4 className="text-brand-secondary">{label}</h4>
      <h5>Completed issues: {payload[0]?.value}</h5>
    </div>
  );

  return (
    <div>
      <div className="mb-0.5 flex justify-between">
        <h3 className="font-semibold">Issues closed by you</h3>
        <CustomMenu label={<span className="text-sm">{MONTHS[month - 1]}</span>} noBorder>
          {MONTHS.map((month, index) => (
            <CustomMenu.MenuItem key={month} onClick={() => setMonth(index + 1)}>
              {month}
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </div>
      <div className="rounded-[10px] border border-brand-base bg-brand-sidebar p-8 pl-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid stroke="#e2e2e280" />
            <XAxis dataKey="week_in_month" padding={{ left: 48, right: 48 }} />
            <YAxis dataKey="completed_count" allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="completed_count"
              stroke="#d687ff"
              strokeWidth={3}
              fill="#8e2de2"
            />
          </LineChart>
        </ResponsiveContainer>
        <h4 className="mt-4 flex items-center justify-center gap-2 text-[#d687ff]">
          <span className="h-2 w-2 bg-[#d687ff]" />
          Completed Issues
        </h4>
      </div>
    </div>
  );
};
