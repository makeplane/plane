/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import type { TTeamspaceActivity } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
// plane web constants
import { TEAM_UPDATES_HELPER_MAP } from "@/constants/teamspace";
// plane web helpers
import { getTeamspaceActivityKey } from "@/helpers/teamspace/activity";
// plane web services
import { useTeamspaceUpdates } from "@/plane-web/hooks/store/teamspaces/use-teamspace-updates";

type TTeamspaceActivityProps = {
  teamspaceId: string;
};

type TTeamspaceActivityItemProps = {
  activity: TTeamspaceActivity;
  ends: "top" | "bottom" | undefined;
};

export const TeamspaceActivityItem = observer(function TeamspaceActivityItem(props: TTeamspaceActivityItemProps) {
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

export const TeamsOverviewSidebarActivity = observer(function TeamsOverviewSidebarActivity(
  props: TTeamspaceActivityProps
) {
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
      <div className="flex flex-col">
        <div className="flex gap-2 items-center justify-between">
          <span className="text-body-xs-semibold">Activity</span>
          <span className="flex items-center gap-2">
            {teamActivitiesLoader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
            <ActivitySortRoot
              sortOrder={teamspaceActivitySortOrder}
              toggleSort={() => {
                toggleTeamspaceActivitySortOrder();
              }}
            />
          </span>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto vertical-scrollbar scrollbar-sm">
        <div className="space-y-3">
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
