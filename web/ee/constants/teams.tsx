import { AlignLeft, Briefcase, FileText, Layers, Type, User2, Users } from "lucide-react";
// plane imports
import { ETeamScope } from "@plane/constants";
import { TCreateUpdateTeamModal, TCreateUpdateTeamViewModal } from "@plane/types";
import { TeamsIcon } from "@plane/ui";
// store
import { getPageName } from "@/helpers/page.helper";
import { store } from "@/lib/store-context";
// plane web types
import { TTeamActivity, TTeamActivityDetailsHelperMap } from "@/plane-web/types";

export const DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA: TCreateUpdateTeamModal = {
  isOpen: false,
  teamId: undefined,
};

export const DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA: TCreateUpdateTeamViewModal = {
  isOpen: false,
  teamId: undefined,
};

export const TEAM_SCOPE_MAP: Record<ETeamScope, { key: ETeamScope; label: string }> = {
  [ETeamScope.YOUR_TEAMS]: { key: ETeamScope.YOUR_TEAMS, label: "Your teams" },
  [ETeamScope.ALL_TEAMS]: { key: ETeamScope.ALL_TEAMS, label: "All teams" },
};

const commonIconClassName = "h-4 w-4 flex-shrink-0 text-custom-text-300";
const commonTextClassName = "text-custom-text-100 font-medium";

// TODO: Add redirect link for relevant activities
export const TEAM_UPDATES_HELPER_MAP: Partial<TTeamActivityDetailsHelperMap> = {
  team_space_created: () => ({
    icon: <TeamsIcon className={commonIconClassName} />,
    message: <>created the team.</>,
  }),
  team_space_deleted: () => ({
    icon: <TeamsIcon className={commonIconClassName} />,
    message: <>deleted the team.</>,
  }),
  name_updated: (activity: TTeamActivity) => ({
    icon: <Type className={commonIconClassName} />,
    message: (
      <>
        renamed the team to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  description_updated: () => ({
    icon: <AlignLeft className={commonIconClassName} />,
    message: <>updated the team description.</>,
  }),
  lead_updated: (activity: TTeamActivity) => ({
    icon: <Users className={commonIconClassName} />,
    message: (
      <>
        {activity.old_value && activity.new_value ? (
          <>
            changed the lead to{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.new_value)?.display_name}
            </span>{" "}
            from{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.old_value)?.display_name}
            </span>
            .
          </>
        ) : activity.old_value ? (
          <>
            removed{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.old_value)?.display_name}
            </span>{" "}
            as team lead.
          </>
        ) : activity.new_value ? (
          <>
            set the lead to{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.new_value)?.display_name}
            </span>
            .
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  projects_updated: (activity: TTeamActivity) => ({
    icon: <Briefcase className={commonIconClassName} />,
    message: (
      <>
        {activity.old_value ? (
          <>
            removed project <span className={commonTextClassName}>{activity.old_value}</span> from the team.
          </>
        ) : activity.new_value ? (
          <>
            added project <span className={commonTextClassName}>{activity.new_value}</span> to the team.
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  members_updated: (activity: TTeamActivity) => ({
    icon: <User2 className={commonIconClassName} />,
    message: (
      <>
        {activity.old_value ? (
          <>
            removed <span className={commonTextClassName}>{activity.old_value}</span> from the team.
          </>
        ) : activity.new_value ? (
          <>
            added <span className={commonTextClassName}>{activity.new_value}</span> to the team.
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  view_created: (activity: TTeamActivity) => ({
    icon: <Layers className={commonIconClassName} />,
    message: (
      <>
        created a team view <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  view_deleted: (activity: TTeamActivity) => ({
    icon: <Layers className={commonIconClassName} />,
    message: (
      <>
        removed the team view <span className={commonTextClassName}>{activity.old_value}</span>.
      </>
    ),
  }),
  page_created: (activity: TTeamActivity) => ({
    icon: <FileText className={commonIconClassName} />,
    message: (
      <>
        created a team page <span className={commonTextClassName}>{getPageName(activity.new_value)}</span>.
      </>
    ),
  }),
  page_deleted: (activity: TTeamActivity) => ({
    icon: <FileText className={commonIconClassName} />,
    message: (
      <>
        removed the team page <span className={commonTextClassName}>{getPageName(activity.old_value)}</span>.
      </>
    ),
  }),
};
