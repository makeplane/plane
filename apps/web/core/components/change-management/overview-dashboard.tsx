import type { IChangeOverview } from "@/services/change-management.service";

type Props = {
  data: IChangeOverview;
};

export const OverviewDashboard = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Today's New Changes"
          value={data?.todays_new_count || 0}
          icon="plus-circle"
          colorClass="text-blue-600 bg-blue-100"
        />
        <KpiCard
          title="Critical Changes Open"
          value={data?.critical_open_count || 0}
          icon="alert-triangle"
          colorClass="text-red-600 bg-red-100"
        />
        <KpiCard
          title="Overdue Changes"
          value={data?.overdue_count || 0}
          icon="clock"
          colorClass="text-orange-600 bg-orange-100"
        />
        <KpiCard
          title="Today's High Risk Changes"
          value={data?.todays_high_risk_count || 0}
          icon="activity"
          colorClass="text-purple-600 bg-purple-100"
        />
        <KpiCard
          title="Changes on Hold"
          value={data?.on_hold_count || 0}
          icon="pause-circle"
          colorClass="text-gray-600 bg-gray-100"
        />
        <KpiCard
          title="Changes Awaiting Approval"
          value={data?.awaiting_approval_count || 0}
          icon="check-circle"
          colorClass="text-teal-600 bg-teal-100"
        />
      </div>

      <div className="mt-6 border border-subtle rounded-lg p-6 bg-surface-1 shadow-sm">
        <h3 className="text-lg font-medium text-primary mb-6">Open Changes — By Risk</h3>
        <RiskBarChart data={data?.open_grouped_by_risk || {}} />
      </div>
    </div>
  );
};

// ----- Inline components (would normally be split but this saves files) -----

const KpiCard = ({ title, value, colorClass }: { title: string; value: number; icon: string; colorClass: string }) => {
  return (
    <div className="flex items-center p-4 border border-subtle rounded-lg bg-surface-1 shadow-sm">
      <div className={`p-3 rounded-md mr-4 ${colorClass}`}>
        <div className="w-6 h-6 flex items-center justify-center font-bold">{value.toString().charAt(0)}</div>
      </div>
      <div>
        <p className="text-sm font-medium text-secondary">{title}</p>
        <p className="text-2xl font-semibold text-primary">{value}</p>
      </div>
    </div>
  );
};

const RiskBarChart = ({ data }: { data: Record<string, number> }) => {
  const safeData = data || {};
  const max = Math.max(...Object.values(safeData), 1); // Avoid div by zero

  const riskLevels = [
    { key: "1_critical", label: "Critical", color: "bg-red-500" },
    { key: "2_high", label: "High", color: "bg-orange-500" },
    { key: "3_moderate", label: "Moderate", color: "bg-yellow-500" },
    { key: "4_low", label: "Low", color: "bg-green-500" },
  ];

  return (
    <div className="space-y-4">
      {riskLevels.map((risk) => {
        const val = safeData[risk.key] || 0;
        const width = `${(val / max) * 100}%`;
        return (
          <div key={risk.key} className="flex items-center text-sm">
            <div className="w-24 font-medium text-secondary">{risk.label}</div>
            <div className="flex-1 ml-4 h-6 bg-layer-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${risk.color} transition-all duration-500`}
                style={{ width: val > 0 ? width : "0%" }}
              />
            </div>
            <div className="w-12 text-right font-medium text-primary ml-4">{val}</div>
          </div>
        );
      })}
    </div>
  );
};
