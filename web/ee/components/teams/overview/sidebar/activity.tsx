"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { TTeamActivity } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
import { ActivitySortRoot } from "@/components/issues";
// constants
import { TSORT_ORDER } from "@/constants/common";
// plane web constants
import { TEAM_UPDATES_HELPER_MAP } from "@/plane-web/constants/teams";
// plane web helpers
import { getTeamActivityKey } from "@/plane-web/helpers/team-helper";
// plane web services
import { useTeamUpdates } from "@/plane-web/hooks/store/teams/use-team-updates";

type TTeamActivityProps = {
  teamId: string;
};

type TTeamActivityItemProps = {
  activity: TTeamActivity;
  ends: "top" | "bottom" | undefined;
};

export const TeamActivityItem = observer((props: TTeamActivityItemProps) => {
  const { activity, ends } = props;
  // return if activity details are not available
  if (!activity) return <></>;
  // derived values
  const teamActivityKey = getTeamActivityKey(activity.field, activity.verb);
  const getTeamActivity = TEAM_UPDATES_HELPER_MAP[teamActivityKey];

  if (getTeamActivity) {
    const { icon, message, customUserName } = getTeamActivity(activity);
    return (
      <ActivityBlockComponent icon={icon} activity={activity} ends={ends} customUserName={customUserName}>
        <>{message}</>
      </ActivityBlockComponent>
    );
  }

  return <></>;
});

export const TeamsOverviewSidebarActivity: FC<TTeamActivityProps> = observer((props) => {
  const { teamId } = props;
  // store hooks
  const { getTeamActivities, getTeamActivitiesLoader, getTeamActivitySortOrder, toggleTeamActivitySortOrder } =
    useTeamUpdates();
  // derived values
  const teamActivitiesLoader = getTeamActivitiesLoader(teamId);
  const teamActivities = getTeamActivities(teamId);
  const teamActivitySortOrder = getTeamActivitySortOrder(teamId);

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
      <div className="py-2 flex flex-col px-6">
        <div className="flex gap-2 items-center justify-between">
          <span className="text-sm font-semibold">Activity</span>
          <span className="flex items-center gap-2">
            {teamActivitiesLoader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
            <ActivitySortRoot
              sortOrder={teamActivitySortOrder as TSORT_ORDER} //TODO: fix this by changing store types.
              toggleSort={() => toggleTeamActivitySortOrder(teamId)}
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
                  <TeamActivityItem
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
