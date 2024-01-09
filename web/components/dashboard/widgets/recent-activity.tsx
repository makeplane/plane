import { useEffect } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useDashboard } from "hooks/store";
// components
import { RecentActivityWidgetLoader } from "components/dashboard/widgets";

type Props = {
  dashboardId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "recent_activity";

export const RecentActivityWidget: React.FC<Props> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { getWidgetStats, fetchWidgetStats, widgetStats: allWidgetStats } = useDashboard();
  const widgetStats = getWidgetStats<any>(workspaceSlug, dashboardId, WIDGET_KEY);

  useEffect(() => {
    if (!widgetStats) fetchWidgetStats(workspaceSlug, dashboardId, WIDGET_KEY);
  }, [dashboardId, fetchWidgetStats, widgetStats, workspaceSlug]);

  console.log("allWidgetStats", allWidgetStats);

  if (!widgetStats) return <RecentActivityWidgetLoader />;

  return (
    <Link
      href="/profile/activity"
      className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full py-6 hover:shadow-custom-shadow-4xl duration-300"
    >
      <div className="flex items-center justify-between gap-2 px-7">
        <h4 className="text-lg font-semibold text-custom-text-300">My activity</h4>
      </div>
    </Link>
  );
});
