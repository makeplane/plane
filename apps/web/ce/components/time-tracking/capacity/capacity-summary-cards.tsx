import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface ICapacitySummaryCardsProps {
  totalLoggedMinutes: number;
}

export const CapacitySummaryCards = observer((props: ICapacitySummaryCardsProps) => {
  const { totalLoggedMinutes } = props;
  const { t } = useTranslation();

  const formatHours = (minutes: number) => (minutes / 60).toFixed(1);

  // Pie chart distribution - mock based on standard labels
  const pieData = [
    { name: "Development", value: 65 },
    { name: "Meeting", value: 15 },
    { name: "Design", value: 10 },
    { name: "Bug Fixing", value: 10 },
  ];
  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div className="flex flex-col gap-4">
        <div className="group relative flex flex-col justify-center rounded-xl overflow-hidden border border-subtle bg-gradient-to-br from-surface-1 to-surface-2 p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 h-full">
          <div className="absolute top-0 right-0 w-12 h-12 bg-accent-primary/5 rounded-bl-[80px] transition-all group-hover:bg-accent-primary/10" />
          <span className="text-12 tracking-wide font-medium uppercase text-tertiary">
            {t("capacity_total_logged")}
          </span>
          <span className="text-2xl font-bold text-primary mt-2 tracking-tight">
            {formatHours(totalLoggedMinutes)}
            <span className="text-13 font-medium text-secondary/60 ml-0.5">h</span>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-subtle bg-gradient-to-b from-surface-1 to-surface-2 p-5 flex flex-col items-center col-span-1 shadow-sm hover:shadow-md transition-all duration-300">
        <span className="text-12 font-medium tracking-wide uppercase text-tertiary self-start mb-4">
          {t("capacity_category_distribution")}
        </span>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-12 text-secondary mt-2">
          {pieData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></span>
              {entry.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
