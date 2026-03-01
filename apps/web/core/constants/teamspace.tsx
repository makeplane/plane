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

import { AlignLeft, Type, User2 } from "lucide-react";
// plane imports
import type {
  ERelationType,
  EStatisticsLegend,
  ETeamspaceAnalyticsDataKeys,
  ETeamspaceAnalyticsValueKeys,
  EProgressXAxisKeys,
} from "@plane/constants";
import { ETeamspaceScope } from "@plane/constants";
import { MembersPropertyIcon, PageIcon, ProjectIcon, TeamsIcon, ViewsIcon } from "@plane/propel/icons";
import type { TCreateUpdateTeamspaceModal, TCreateUpdateTeamspaceViewModal, TTeamspaceActivity } from "@plane/types";
// helpers
import { getPageName } from "@plane/utils";
// store
import { store } from "@/lib/store-context";
// plane web types
import type { TTeamspaceActivityDetailsHelperMap } from "@/types";

export const DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA: TCreateUpdateTeamspaceModal = {
  isOpen: false,
  teamspaceId: undefined,
};

export const DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA: TCreateUpdateTeamspaceViewModal = {
  isOpen: false,
  teamspaceId: undefined,
};

export const TEAMSPACE_SCOPE_MAP: Record<ETeamspaceScope, { key: ETeamspaceScope; label: string }> = {
  [ETeamspaceScope.YOUR_TEAMS]: { key: ETeamspaceScope.YOUR_TEAMS, label: "Your teamspaces" },
  [ETeamspaceScope.ALL_TEAMS]: { key: ETeamspaceScope.ALL_TEAMS, label: "All teamspaces" },
};

const commonTextClassName = "text-primary font-medium";

// TODO: Add redirect link for relevant activities
export const TEAM_UPDATES_HELPER_MAP: Partial<TTeamspaceActivityDetailsHelperMap> = {
  team_space_created: () => ({
    icon: TeamsIcon,
    message: <>created the teamspace.</>,
  }),
  team_space_deleted: () => ({
    icon: TeamsIcon,
    message: <>deleted the teamspace.</>,
  }),
  name_updated: (activity: TTeamspaceActivity) => ({
    icon: Type,
    message: (
      <>
        renamed the teamspace to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  description_updated: () => ({
    icon: AlignLeft,
    message: <>updated the teamspace&apos;s description.</>,
  }),
  lead_updated: (activity: TTeamspaceActivity) => ({
    icon: MembersPropertyIcon,
    message: (
      <>
        {activity.old_identifier && activity.new_identifier ? (
          <>
            changed the team lead to{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.new_identifier)?.display_name}
            </span>{" "}
            from{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.old_identifier)?.display_name}
            </span>
            .
          </>
        ) : activity.old_identifier ? (
          <>
            removed the team lead{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.old_identifier)?.display_name}
            </span>
            .
          </>
        ) : activity.new_identifier ? (
          <>
            chose{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.new_identifier)?.display_name}
            </span>{" "}
            as the team lead.
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  projects_updated: (activity: TTeamspaceActivity) => ({
    icon: ProjectIcon,
    message: (
      <>
        {activity.old_value ? (
          <>
            unlinked the project <span className={commonTextClassName}>{activity.old_value}</span> from the teamspace.
          </>
        ) : activity.new_value ? (
          <>
            linked the project <span className={commonTextClassName}>{activity.new_value}</span> to the teamspace.
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  members_updated: (activity: TTeamspaceActivity) => ({
    icon: User2,
    message: (
      <>
        {activity.old_value ? (
          <>
            removed <span className={commonTextClassName}>{activity.old_value}</span> from the teamspace.
          </>
        ) : activity.new_value ? (
          <>
            added <span className={commonTextClassName}>{activity.new_value}</span> to the teamspace.
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  view_created: (activity: TTeamspaceActivity) => ({
    icon: ViewsIcon,
    message: (
      <>
        created the view <span className={commonTextClassName}>{activity.new_value}</span> in this teamspace.
      </>
    ),
  }),
  view_deleted: (activity: TTeamspaceActivity) => ({
    icon: ViewsIcon,
    message: (
      <>
        removed the view <span className={commonTextClassName}>{activity.old_value}</span> from this teamspace.
      </>
    ),
  }),
  page_created: (activity: TTeamspaceActivity) => ({
    icon: PageIcon,
    message: (
      <>
        created the page <span className={commonTextClassName}>{getPageName(activity.new_value)}</span> in this
        teamspace.
      </>
    ),
  }),
  page_deleted: (activity: TTeamspaceActivity) => ({
    icon: PageIcon,
    message: (
      <>
        removed the page <span className={commonTextClassName}>{getPageName(activity.old_value)}</span> from this
        teamspace.
      </>
    ),
  }),
};

export const TEAM_WORKLOAD_X_AXIS_LABEL_MAP: Record<EProgressXAxisKeys, string> = {
  target_date: "Due date",
  start_date: "Start date",
  priority: "Priority",
};

export const TEAM_WORKLOAD_Y_AXIS_LABEL_MAP: Record<ETeamspaceAnalyticsValueKeys, string> = {
  issues: "Work items",
  // points: "Points",
};

export const TEAM_STATISTICS_DATA_KEY_MAP: Record<ETeamspaceAnalyticsDataKeys, string> = {
  projects: "Projects",
  members: "Members",
};

export const TEAM_STATISTICS_VALUE_KEY_MAP: Record<ETeamspaceAnalyticsValueKeys, string> = {
  issues: "No. of work items",
  // points: "Total points",`
};

export const TEAM_STATISTICS_LEGEND_MAP: Record<EStatisticsLegend, string> = {
  state: "State",
  priority: "Priority",
};

export const TEAM_STATISTICS_DEPENDENCY_MAP: Record<ERelationType, string> = {
  blocking: "Blocking",
  blocked_by: "Blocked by",
};
