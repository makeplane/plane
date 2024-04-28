import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { History } from "lucide-react";
// types
import { TRecentActivityWidgetResponse } from "@plane/types";
// UI
import { Avatar, getButtonStyling } from "@plane/ui";
// components
import { ActivityIcon, ActivityMessage, IssueLink } from "@/components/core";
import { RecentActivityEmptyState, WidgetLoader, WidgetProps } from "@/components/dashboard/widgets";
// helpers
import { cn } from "@/helpers/common.helper";
import { calculateTimeAgo } from "@/helpers/date-time.helper";
// hooks
import { useDashboard, useUser } from "@/hooks/store";

const WIDGET_KEY = "recent_activity";

export const RecentActivityWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { data: currentUser } = useUser();
  // derived values
  const { fetchWidgetStats, getWidgetStats } = useDashboard();
  const widgetStats = getWidgetStats<TRecentActivityWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);
  const redirectionLink = `/${workspaceSlug}/profile/${currentUser?.id}/activity`;

  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="min-h-96 w-full rounded-xl border-[0.5px] border-custom-border-200 bg-custom-background-100 py-6 duration-300 hover:shadow-custom-shadow-4xl">
      <Link href={redirectionLink} className="mx-7 text-lg font-semibold text-custom-text-300 hover:underline">
        Your issue activities
      </Link>
      {widgetStats.length > 0 ? (
        <div className="mx-7 mt-4 space-y-6">
          {widgetStats.map((activity) => (
            <div key={activity.id} className="flex gap-5">
              <div className="flex-shrink-0">
                {activity.field ? (
                  activity.new_value === "restore" ? (
                    <History className="h-3.5 w-3.5 text-custom-text-200" />
                  ) : (
                    <div className="flex h-6 w-6 justify-center">
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
              <div className="-mt-2 break-words">
                <p className="inline text-sm text-custom-text-200">
                  <span className="font-medium text-custom-text-100">
                    {currentUser?.id === activity.actor_detail.id ? "You" : activity.actor_detail?.display_name}{" "}
                  </span>
                  {activity.field ? (
                    <ActivityMessage activity={activity} showIssue />
                  ) : (
                    <span>
                      created <IssueLink activity={activity} />
                    </span>
                  )}
                </p>
                <p className="text-xs text-custom-text-200 whitespace-nowrap">
                  {calculateTimeAgo(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
          <Link
            href={redirectionLink}
            className={cn(
              getButtonStyling("link-primary", "sm"),
              "mx-auto w-min px-2 py-1 text-xs hover:bg-custom-primary-100/20"
            )}
          >
            View all
          </Link>
        </div>
      ) : (
        <div className="grid h-full place-items-center">
          <RecentActivityEmptyState />
        </div>
      )}
    </div>
  );
});
