"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { TEAMSPACE_UPDATES_TRACKER_ELEMENTS } from "@plane/constants";
import { TTeamspaceActivity } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
import { ActivitySortRoot } from "@/components/issues";
// plane web constants
import { captureClick } from "@/helpers/event-tracker.helper";
import { TEAM_UPDATES_HELPER_MAP } from "@/plane-web/constants/teamspace";
// plane web helpers
import { getTeamspaceActivityKey } from "@/plane-web/helpers/teamspace-helper";
// plane web services
import { useTeamspaceUpdates } from "@/plane-web/hooks/store/teamspaces/use-teamspace-updates";

type TTeamspaceActivityProps = {
  teamspaceId: string;
};

type TTeamspaceActivityItemProps = {
  activity: TTeamspaceActivity;
  ends: "top" | "bottom" | undefined;
};

export const TeamspaceActivityItem = observer((props: TTeamspaceActivityItemProps) => {
  const { activity, ends } = props;
  // return if activity details are not available
  if (!activity) return <></>;
  // derived values
  const teamspaceActivityKey = getTeamspaceActivityKey(activity.field, activity.verb);
  const getTeamspaceActivity = TEAM_UPDATES_HELPER_MAP[teamspaceActivityKey];

  if (getTeamspaceActivity) {
    const { icon, message, customUserName } = getTeamspaceActivity(activity);
    return (
      <ActivityBlockComponent icon={icon} activity={activity} ends={ends} customUserName={customUserName}>
        <>{message}</>
      </ActivityBlockComponent>
    );
  }

  return <></>;
});

export const TeamsOverviewSidebarActivity: FC<TTeamspaceActivityProps> = observer((props) => {
  const { teamspaceId } = props;
  // store hooks
  const {
    getTeamspaceActivities,
    getTeamspaceActivitiesLoader,
    getTeamspaceActivitySortOrder,
    toggleTeamspaceActivitySortOrder,
  } = useTeamspaceUpdates();
  // derived values
  const teamActivitiesLoader = getTeamspaceActivitiesLoader(teamspaceId);
  const teamActivities = getTeamspaceActivities(teamspaceId);
  const teamspaceActivitySortOrder = getTeamspaceActivitySortOrder();

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
      <div className="py-2 flex flex-col px-6">
        <div className="flex gap-2 items-center justify-between">
          <span className="text-sm font-semibold">Activity</span>
          <span className="flex items-center gap-2">
            {teamActivitiesLoader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
            <ActivitySortRoot
              sortOrder={teamspaceActivitySortOrder}
              toggleSort={() => {
                captureClick({
                  elementName: TEAMSPACE_UPDATES_TRACKER_ELEMENTS.SIDEBAR_ACTIVITY_SORT_BUTTON,
                });
                toggleTeamspaceActivitySortOrder();
              }}
              className="py-1"
              iconClassName="size-3"
            />
          </span>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto vertical-scrollbar scrollbar-sm">
        <div className="space-y-3 px-6">
          {teamActivitiesLoader === "init-loader" ? (
            <Loader className="space-y-3">
              <Loader.Item height="34px" width="100%" />
              <Loader.Item height="34px" width="100%" />
              <Loader.Item height="34px" width="100%" />
            </Loader>
          ) : (
            <div>
              {teamActivities &&
                teamActivities.map((activity, index) => (
                  <TeamspaceActivityItem
                    key={activity.id}
                    activity={activity}
                    ends={index === 0 ? "top" : index === teamActivities.length - 1 ? "bottom" : undefined}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
