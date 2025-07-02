import { AlignLeft, Briefcase, FileText, Layers, Type, User2, Users } from "lucide-react";
// plane imports
import {
  ERelationType,
  EStatisticsLegend,
  ETeamspaceAnalyticsDataKeys,
  ETeamspaceAnalyticsValueKeys,
  ETeamspaceScope,
  EProgressXAxisKeys,
} from "@plane/constants";
import { TCreateUpdateTeamspaceModal, TCreateUpdateTeamspaceViewModal, TTeamspaceActivity } from "@plane/types";
import { TeamsIcon } from "@plane/ui";
// helpers
import { getPageName  } from "@plane/utils";
// store
import { store } from "@/lib/store-context";
// plane web types
import { TTeamspaceActivityDetailsHelperMap } from "@/plane-web/types";

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

const commonIconClassName = "h-4 w-4 flex-shrink-0 text-custom-text-300";
const commonTextClassName = "text-custom-text-100 font-medium";

// TODO: Add redirect link for relevant activities
export const TEAM_UPDATES_HELPER_MAP: Partial<TTeamspaceActivityDetailsHelperMap> = {
  team_space_created: () => ({
    icon: <TeamsIcon className={commonIconClassName} />,
    message: <>created the teamspace.</>,
  }),
  team_space_deleted: () => ({
    icon: <TeamsIcon className={commonIconClassName} />,
    message: <>deleted the teamspace.</>,
  }),
  name_updated: (activity: TTeamspaceActivity) => ({
    icon: <Type className={commonIconClassName} />,
    message: (
      <>
        renamed the teamspace to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  description_updated: () => ({
    icon: <AlignLeft className={commonIconClassName} />,
    message: <>updated the teamspace&apos;s description.</>,
  }),
  lead_updated: (activity: TTeamspaceActivity) => ({
    icon: <Users className={commonIconClassName} />,
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
    icon: <Briefcase className={commonIconClassName} />,
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
    icon: <User2 className={commonIconClassName} />,
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
    icon: <Layers className={commonIconClassName} />,
    message: (
      <>
        created the view <span className={commonTextClassName}>{activity.new_value}</span> in this teamspace.
      </>
    ),
  }),
  view_deleted: (activity: TTeamspaceActivity) => ({
    icon: <Layers className={commonIconClassName} />,
    message: (
      <>
        removed the view <span className={commonTextClassName}>{activity.old_value}</span> from this teamspace.
      </>
    ),
  }),
  page_created: (activity: TTeamspaceActivity) => ({
    icon: <FileText className={commonIconClassName} />,
    message: (
      <>
        created the page <span className={commonTextClassName}>{getPageName(activity.new_value)}</span> in this
        teamspace.
      </>
    ),
  }),
  page_deleted: (activity: TTeamspaceActivity) => ({
    icon: <FileText className={commonIconClassName} />,
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
