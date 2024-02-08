import { ReactNode } from "react";
// hooks
import { useProject, useModule, useCycle, useProjectState, useMember, useLabel } from "hooks/store";
// ui
import { Avatar, CycleGroupIcon, DiceIcon, PriorityIcon, StateGroupIcon } from "@plane/ui";
// types
import { TIssuePriorities, TStateGroups, TViewFilters } from "@plane/types";
// constants
import { STATE_GROUP_PROPERTY, PRIORITIES_PROPERTY, DATE_PROPERTY } from "constants/view/filters";
import { Briefcase, CalendarDays } from "lucide-react";
// helpers
import { renderEmoji } from "helpers/emoji.helper";

type TFilterPropertyDetails = {
  icon: ReactNode;
  label: string;
};

export const useViewFilter = (workspaceSlug: string, projectId: string | undefined) => {
  const { projectMap, getProjectById } = useProject();
  const { getProjectModuleIds, getModuleById } = useModule();
  const { getProjectCycleIds, getCycleById } = useCycle();
  const { getProjectStates, getStateById } = useProjectState();
  const {
    getUserDetails,
    workspace: { workspaceMemberIds },
    project: { getProjectMemberIds },
  } = useMember();
  const { workspaceLabels, getProjectLabels, getLabelById } = useLabel();

  if (!workspaceSlug) return undefined;

  const filterIdsWithKey = (filterKey: keyof TViewFilters): string[] | undefined => {
    if (!filterKey) return undefined;

    switch (filterKey) {
      case "project":
        return Object.keys(projectMap) || undefined;
      case "module":
        if (!projectId) return undefined;
        return getProjectModuleIds(projectId) || undefined;
      case "cycle":
        if (!projectId) return undefined;
        return getProjectCycleIds(projectId) || undefined;
      case "priority":
        return Object.keys(PRIORITIES_PROPERTY) || undefined;
      case "state":
        if (!projectId) return undefined;
        return getProjectStates(projectId)?.map((state) => state.id) || undefined;
      case "state_group":
        return Object.keys(STATE_GROUP_PROPERTY) || undefined;
      case "assignees":
        if (projectId) return getProjectMemberIds(projectId) || undefined;
        return workspaceMemberIds || undefined;
      case "mentions":
        if (projectId) return getProjectMemberIds(projectId) || undefined;
        return workspaceMemberIds || undefined;
      case "subscriber":
        if (projectId) return getProjectMemberIds(projectId) || undefined;
        return workspaceMemberIds || undefined;
      case "created_by":
        if (projectId) return getProjectMemberIds(projectId) || undefined;
        return workspaceMemberIds || undefined;
      case "labels":
        if (projectId) return getProjectLabels(projectId)?.map((label) => label.id) || undefined;
        return workspaceLabels?.map((label) => label.id) || undefined;
      case "start_date":
        return Object.keys(DATE_PROPERTY) || undefined;
      case "target_date":
        return Object.keys(DATE_PROPERTY) || undefined;
      default:
        return undefined;
    }
  };

  const propertyDetails = (filterKey: keyof TViewFilters, propertyId: string): TFilterPropertyDetails | undefined => {
    if (!filterKey || !propertyId) return undefined;

    switch (filterKey) {
      case "project":
        const projectPropertyDetail = getProjectById(propertyId);
        if (!projectPropertyDetail) return undefined;
        return {
          icon: (
            <>
              {projectPropertyDetail.emoji ? (
                <div className="text-xs">{renderEmoji(projectPropertyDetail.emoji)}</div>
              ) : projectPropertyDetail.icon_prop ? (
                <div className="text-xs">{renderEmoji(projectPropertyDetail.icon_prop)}</div>
              ) : (
                <Briefcase size={12} />
              )}
            </>
          ),
          label: projectPropertyDetail.name,
        };
      case "module":
        const modulePropertyDetail = getModuleById(propertyId);
        if (!modulePropertyDetail) return undefined;
        return {
          icon: <DiceIcon className="w-3 h-3" />,
          label: modulePropertyDetail.name,
        };
      case "cycle":
        const cyclePropertyDetail = getCycleById(propertyId);
        if (!cyclePropertyDetail) return undefined;
        return {
          icon: <CycleGroupIcon cycleGroup={cyclePropertyDetail.status} height="14px" width="14px" />,
          label: cyclePropertyDetail.name,
        };
      case "priority":
        const priorityPropertyDetail = PRIORITIES_PROPERTY?.[propertyId as TIssuePriorities];
        if (!priorityPropertyDetail) return undefined;
        return {
          icon: <PriorityIcon priority={propertyId as TIssuePriorities} size={10} withContainer />,
          label: priorityPropertyDetail.label,
        };
      case "state":
        const statePropertyDetail = getStateById(propertyId);
        if (!statePropertyDetail) return undefined;
        return {
          icon: <StateGroupIcon stateGroup={statePropertyDetail.group} />,
          label: statePropertyDetail.name,
        };
      case "state_group":
        const stateGroupPropertyDetail = STATE_GROUP_PROPERTY?.[propertyId as TStateGroups];
        if (!stateGroupPropertyDetail) return undefined;
        return {
          icon: <StateGroupIcon stateGroup={propertyId as TStateGroups} />,
          label: stateGroupPropertyDetail.label,
        };
      case "assignees":
        const assigneePropertyDetail = getUserDetails(propertyId);
        if (!assigneePropertyDetail) return undefined;
        return {
          icon: (
            <Avatar
              name={assigneePropertyDetail.display_name}
              src={assigneePropertyDetail.avatar}
              size={"sm"}
              showTooltip={false}
            />
          ),
          label: assigneePropertyDetail.display_name,
        };
      case "mentions":
        const mentionPropertyDetail = getUserDetails(propertyId);
        if (!mentionPropertyDetail) return undefined;
        return {
          icon: (
            <Avatar
              name={mentionPropertyDetail.display_name}
              src={mentionPropertyDetail.avatar}
              size={"sm"}
              showTooltip={false}
            />
          ),
          label: mentionPropertyDetail.display_name,
        };
      case "subscriber":
        const subscribedPropertyDetail = getUserDetails(propertyId);
        if (!subscribedPropertyDetail) return undefined;
        return {
          icon: (
            <Avatar
              name={subscribedPropertyDetail.display_name}
              src={subscribedPropertyDetail.avatar}
              size={"sm"}
              showTooltip={false}
            />
          ),
          label: subscribedPropertyDetail.display_name,
        };
      case "created_by":
        const createdByPropertyDetail = getUserDetails(propertyId);
        if (!createdByPropertyDetail) return undefined;
        return {
          icon: (
            <Avatar
              name={createdByPropertyDetail.display_name}
              src={createdByPropertyDetail.avatar}
              size={"sm"}
              showTooltip={false}
            />
          ),
          label: createdByPropertyDetail.display_name,
        };
      case "labels":
        const labelPropertyDetail = getLabelById(propertyId);
        if (!labelPropertyDetail) return undefined;
        return {
          icon: (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: labelPropertyDetail.color,
              }}
            />
          ),
          label: labelPropertyDetail.name,
        };
      case "start_date":
        const startDatePropertyDetail = DATE_PROPERTY?.[propertyId];
        if (!startDatePropertyDetail) return undefined;
        return {
          icon: <CalendarDays size={12} />,
          label: startDatePropertyDetail.label,
        };
      case "target_date":
        const targetDatePropertyDetail = DATE_PROPERTY?.[propertyId];
        if (!targetDatePropertyDetail) return undefined;
        return {
          icon: <CalendarDays size={12} />,
          label: targetDatePropertyDetail.label,
        };
      default:
        return undefined;
    }
  };

  return {
    filterIdsWithKey,
    propertyDetails,
  };
};
