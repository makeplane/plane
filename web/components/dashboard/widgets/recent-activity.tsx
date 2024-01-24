import { useEffect } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { History } from "lucide-react";
// hooks
import { useDashboard, useUser } from "hooks/store";
// components
import { ActivityIcon, ActivityMessage, IssueLink } from "components/core";
import { RecentActivityEmptyState, WidgetLoader, WidgetProps } from "components/dashboard/widgets";
// ui
import { Avatar } from "@plane/ui";
// helpers
import { calculateTimeAgo } from "helpers/date-time.helper";
// types
import { TRecentActivityWidgetResponse } from "@plane/types";

const WIDGET_KEY = "recent_activity";

export const RecentActivityWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { currentUser } = useUser();
  // derived values
  const { fetchWidgetStats, getWidgetStats } = useDashboard();
  const widgetStats = getWidgetStats<TRecentActivityWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);

  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full py-6 hover:shadow-custom-shadow-4xl duration-300 min-h-96">
      <Link href="/profile/activity" className="text-lg font-semibold text-custom-text-300 mx-7 hover:underline">
        Your issue activities
      </Link>
      {widgetStats.length > 0 ? (
        <div className="space-y-6 mt-4 mx-7">
          {widgetStats.map((activity) => (
            <div key={activity.id} className="flex gap-5">
              <div className="flex-shrink-0">
                {activity.field ? (
                  activity.new_value === "restore" ? (
                    <History className="h-3.5 w-3.5 text-custom-text-200" />
                  ) : (
                    <div className="h-6 w-6 flex justify-center">
                      <ActivityIcon activity={activity} />
                    </div>
                  )
                ) : activity.actor_detail.avatar && activity.actor_detail.avatar !== "" ? (
                  <Avatar
                    src={activity.actor_detail.avatar}
                    name={activity.actor_detail.display_name}
                    size={24}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-700 text-xs text-white">
                    {activity.actor_detail.is_bot
                      ? activity.actor_detail.first_name.charAt(0)
                      : activity.actor_detail.display_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="-mt-1 break-words">
                <p className="text-sm text-custom-text-200">
                  <span className="font-medium text-custom-text-100">
                    {currentUser?.id === activity.actor_detail.id ? "You" : activity.actor_detail.display_name}{" "}
                  </span>
                  {activity.field ? (
                    <ActivityMessage activity={activity} showIssue />
                  ) : (
                    <span>
                      created <IssueLink activity={activity} />
                    </span>
                  )}
                </p>
                <p className="text-xs text-custom-text-200">{calculateTimeAgo(activity.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full grid place-items-center">
          <RecentActivityEmptyState />
        </div>
      )}
    </div>
  );
});
