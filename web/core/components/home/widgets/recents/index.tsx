"use client";

import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// types
import { TRecentActivityWidgetResponse } from "@plane/types";
// components
import { WidgetLoader, WidgetProps } from "@/components/dashboard/widgets";
// hooks
import { useDashboard, useUser } from "@/hooks/store";
import { FiltersDropdown } from "./filters";
import { RecentIssue } from "./issue";

const WIDGET_KEY = "recent_activity";

export const RecentActivityWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  const ref = useRef<HTMLDivElement>(null);
  // store hooks
  const { data: currentUser } = useUser();
  const { activeFilter, setActiveFilter, fetchWidgetStats, getWidgetStats } = useDashboard();
  // derived values
  const widgetStats = getWidgetStats<TRecentActivityWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);
  const redirectionLink = `/${workspaceSlug}/profile/${currentUser?.id}/activity`;

  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  const resolveRecent = (activity: TRecentActivityWidgetResponse) => {
    console.log();
    return <RecentIssue activity={activity} ref={ref} />;
  };

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between">
        <Link href={redirectionLink} className="text-base font-semibold text-custom-text-350 hover:underline">
          Recent
        </Link>

        <FiltersDropdown activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      </div>
      {widgetStats.length > 0 && (
        <div className="mt-2">
          {widgetStats.map((activity) => (
            <div key={activity.id}>{resolveRecent(activity)}</div>
          ))}
        </div>
      )}
    </div>
  );
});
