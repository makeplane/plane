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

// plane imports
import { EIconSize, ISSUE_PRIORITIES, STATE_GROUPS } from "@plane/constants";
import { Logo } from "@plane/propel/emoji-icon-picker";
import {
  CycleGroupIcon,
  CycleIcon,
  EpicIcon,
  MilestoneIcon,
  ModuleIcon,
  PriorityIcon,
  StateGroupIcon,
} from "@plane/propel/icons";
import type { IGroupByColumn, TCycleGroups, GroupByColumnTypes, TGetColumns } from "@plane/types";
import { Avatar } from "@plane/ui";
import { getFileURL, getMilestoneIconProps } from "@plane/utils";
// store
import { store } from "@/lib/store-context";
// types
import type { TGetGroupByColumns } from "./types";

// NOTE: Type of groupBy is different compared to what's being passed from the components.
// We are using `as` to typecast it to the expected type.
// It can break the includeNone logic if not handled properly.
export const getGroupByColumns = ({
  groupBy,
  includeNone,
  isWorkspaceLevel,
  isEpic = false,
  projectId,
}: TGetGroupByColumns): IGroupByColumn[] | undefined => {
  // If no groupBy is specified and includeNone is true, return "All Issues" group
  if (!groupBy && includeNone) {
    return [
      {
        id: "All Issues",
        name: `All ${isEpic ? "Epics" : "work items"}`,
        payload: {},
        icon: undefined,
      },
    ];
  }

  // Return undefined if no valid groupBy
  if (!groupBy) return undefined;

  // Map of group by options to their corresponding column getter functions
  const groupByColumnMap: Record<
    GroupByColumnTypes,
    ({ isWorkspaceLevel, projectId }: TGetColumns) => IGroupByColumn[] | undefined
  > = {
    project: getProjectColumns,
    cycle: getCycleColumns,
    module: getModuleColumns,
    state: getStateColumns,
    "state_detail.group": getStateGroupColumns,
    priority: getPriorityColumns,
    labels: getLabelsColumns,
    assignees: getAssigneeColumns,
    created_by: getCreatedByColumns,
    team_project: getTeamProjectColumns,
    milestone: getMilestoneColumns,
    epic: getEpicColumns,
  };

  // Get and return the columns for the specified group by option
  return groupByColumnMap[groupBy]?.({ isWorkspaceLevel, projectId });
};

const getProjectColumns = (): IGroupByColumn[] | undefined => {
  const { joinedProjectIds: projectIds, projectMap } = store.projectRoot.project;
  // Return undefined if no project ids
  if (!projectIds) return;
  // Map project ids to project columns
  return projectIds
    .map((projectId: string) => {
      const project = projectMap[projectId];
      if (!project) return;
      return {
        id: project.id,
        name: project.name,
        icon: (
          <div className="w-6 h-6 grid place-items-center flex-shrink-0">
            <Logo logo={project.logo_props} />
          </div>
        ),
        payload: { project_id: project.id },
      };
    })
    .filter((column) => column !== undefined) as IGroupByColumn[];
};

const getCycleColumns = (): IGroupByColumn[] | undefined => {
  const { currentProjectDetails } = store.projectRoot.project;
  // Check for the current project details
  if (!currentProjectDetails || !currentProjectDetails?.id) return;
  const { getProjectCycleDetails } = store.cycle;
  // Get the cycle details for the current project
  const cycleDetails = currentProjectDetails?.id ? getProjectCycleDetails(currentProjectDetails?.id) : undefined;
  // Map the cycle details to the group by columns
  const cycles: IGroupByColumn[] = [];
  cycleDetails?.map((cycle) => {
    const cycleStatus = cycle.status ? (cycle.status.toLocaleLowerCase() as TCycleGroups) : "draft";
    const isDropDisabled = cycleStatus === "completed";
    cycles.push({
      id: cycle.id,
      name: cycle.name,
      icon: <CycleGroupIcon cycleGroup={cycleStatus} className="h-3.5 w-3.5" />,
      payload: { cycle_id: cycle.id },
      isDropDisabled,
      dropErrorMessage: isDropDisabled ? "Work item cannot be moved to completed cycles" : undefined,
    });
  });
  cycles.push({
    id: "None",
    name: "None",
    icon: <CycleIcon className="h-3.5 w-3.5" />,
    payload: {},
  });
  return cycles;
};

const getModuleColumns = (): IGroupByColumn[] | undefined => {
  // get current project details
  const { currentProjectDetails } = store.projectRoot.project;
  if (!currentProjectDetails || !currentProjectDetails?.id) return;
  // get project module ids and module details
  const { getProjectModuleDetails } = store.module;
  // get module details
  const moduleDetails = currentProjectDetails?.id ? getProjectModuleDetails(currentProjectDetails?.id) : undefined;
  // map module details to group by columns
  const modules: IGroupByColumn[] = [];
  moduleDetails?.map((module) => {
    modules.push({
      id: module.id,
      name: module.name,
      icon: <ModuleIcon className="h-3.5 w-3.5" />,
      payload: { module_ids: [module.id] },
    });
  });
  modules.push({
    id: "None",
    name: "None",
    icon: <ModuleIcon className="h-3.5 w-3.5" />,
    payload: {},
  });
  return modules;
};

const getStateColumns = ({ projectId }: TGetColumns): IGroupByColumn[] | undefined => {
  const { getProjectStates, projectStates } = store.state;
  const _states = projectId ? getProjectStates(projectId) : projectStates;
  if (!_states) return;
  // map project states to group by columns
  return _states.map((state) => ({
    id: state.id,
    name: state.name,
    icon: (
      <div className="size-4 rounded-full">
        <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} percentage={state.order} />
      </div>
    ),
    payload: { state_id: state.id },
  }));
};

const getStateGroupColumns = (): IGroupByColumn[] => {
  const stateGroups = STATE_GROUPS;
  // map state groups to group by columns
  return Object.values(stateGroups).map((stateGroup) => ({
    id: stateGroup.key,
    name: stateGroup.label,
    icon: (
      <div className="size-4 rounded-full">
        <StateGroupIcon stateGroup={stateGroup.key} size={EIconSize.LG} />
      </div>
    ),
    payload: {},
  }));
};

const getPriorityColumns = (): IGroupByColumn[] => {
  const priorities = ISSUE_PRIORITIES;
  // map priorities to group by columns
  return priorities.map((priority) => ({
    id: priority.key,
    name: priority.title,
    icon: <PriorityIcon priority={priority?.key} />,
    payload: { priority: priority.key },
  }));
};

const getLabelsColumns = ({ isWorkspaceLevel }: TGetColumns): IGroupByColumn[] => {
  const { workspaceLabels, projectLabels } = store.label;
  // map labels to group by columns
  const labels = [
    ...(isWorkspaceLevel ? workspaceLabels || [] : projectLabels || []),
    { id: "None", name: "None", color: "#666" },
  ];
  // map labels to group by columns
  return labels.map((label) => ({
    id: label.id,
    name: label.name,
    icon: (
      <div className="h-[12px] w-[12px] rounded-full" style={{ backgroundColor: label.color ? label.color : "#666" }} />
    ),
    payload: label?.id === "None" ? {} : { label_ids: [label.id] },
  }));
};

type TGetScopeMemberIdsResult = {
  memberIds: string[];
  includeNone: boolean;
};

const getScopeMemberIds = ({ isWorkspaceLevel, projectId }: TGetColumns): TGetScopeMemberIdsResult => {
  // store values
  const { currentTeamspaceMemberIds } = store.teamspaceRoot.teamspaces;
  const { workspaceMemberIds } = store.memberRoot.workspace;
  const { projectMemberIds } = store.memberRoot.project;
  // derived values
  const memberIds = workspaceMemberIds;

  if (store.router.teamspaceId) {
    return { memberIds: currentTeamspaceMemberIds ?? [], includeNone: false };
  }

  if (isWorkspaceLevel) {
    return { memberIds: memberIds ?? [], includeNone: true };
  }

  if (projectId || (projectMemberIds && projectMemberIds.length > 0)) {
    const { getProjectMemberIds } = store.memberRoot.project;
    const _projectMemberIds = projectId ? getProjectMemberIds(projectId, false) : projectMemberIds;
    return {
      memberIds: _projectMemberIds ?? [],
      includeNone: true,
    };
  }

  return { memberIds: [], includeNone: true };
};

const getAssigneeColumns = ({ isWorkspaceLevel, projectId }: TGetColumns): IGroupByColumn[] | undefined => {
  // store values
  const { getUserDetails } = store.memberRoot;
  // derived values
  const { memberIds, includeNone } = getScopeMemberIds({ isWorkspaceLevel, projectId });
  const assigneeColumns: IGroupByColumn[] = [];

  if (!memberIds) return [];

  memberIds.forEach((memberId) => {
    const member = getUserDetails(memberId);
    if (!member) return;
    assigneeColumns.push({
      id: memberId,
      name: member?.display_name || "",
      icon: <Avatar name={member?.display_name} src={getFileURL(member?.avatar_url ?? "")} size="md" />,
      payload: { assignee_ids: [memberId] },
    });
  });
  if (includeNone) {
    assigneeColumns.push({ id: "None", name: "None", icon: <Avatar size="md" />, payload: {} });
  }

  return assigneeColumns;
};

const getCreatedByColumns = ({ isWorkspaceLevel, projectId }: TGetColumns): IGroupByColumn[] | undefined => {
  const { getUserDetails } = store.memberRoot;
  // derived values
  const { memberIds, includeNone } = getScopeMemberIds({ isWorkspaceLevel, projectId });
  const createdByColumns: IGroupByColumn[] = [];
  if (!memberIds) return [];

  memberIds.forEach((memberId) => {
    const member = getUserDetails(memberId);
    if (!member) return;
    createdByColumns.push({
      id: memberId,
      name: member?.display_name || "",
      icon: <Avatar name={member?.display_name} src={getFileURL(member?.avatar_url ?? "")} size="md" />,
      payload: { assignee_ids: [memberId] },
    });
  });
  if (includeNone) {
    createdByColumns.push({ id: "None", name: "None", icon: <Avatar size="md" />, payload: {} });
  }

  return createdByColumns;
};

export const getTeamProjectColumns = (): IGroupByColumn[] | undefined => {
  const { projectMap } = store.projectRoot.project;
  const { currentTeamspaceProjectIds } = store.teamspaceRoot.teamspaces;
  // Return undefined if no project ids
  if (!currentTeamspaceProjectIds) return;
  // Map project ids to project columns
  return currentTeamspaceProjectIds
    .map((projectId: string) => {
      const project = projectMap[projectId];
      if (!project) return;
      return {
        id: project.id,
        name: project.name,
        icon: (
          <div className="w-6 h-6 grid place-items-center flex-shrink-0">
            <Logo logo={project.logo_props} />
          </div>
        ),
        payload: { project_id: project.id },
      };
    })
    .filter((column) => column !== undefined) as IGroupByColumn[];
};

export const getMilestoneColumns = (): IGroupByColumn[] | undefined => {
  const { projectId, workspaceSlug } = store.router;
  const { getProjectMilestoneIds, getMilestoneById, isMilestonesEnabled } = store.milestone;

  if (!projectId || !workspaceSlug) return;

  const isMilestonesFeatureEnabled = isMilestonesEnabled(workspaceSlug, projectId);

  if (!isMilestonesFeatureEnabled) return;

  const projectMilestoneIds = getProjectMilestoneIds(projectId);

  if (!projectMilestoneIds) return;

  const milestoneColumns: IGroupByColumn[] = [
    {
      id: "None",
      name: "None",
      icon: <MilestoneIcon className="w-4 h-4 text-primary" />,
      payload: {},
    },
  ];

  projectMilestoneIds.map((milestoneId) => {
    const milestone = getMilestoneById(projectId.toString(), milestoneId);
    if (!milestone) return;
    milestoneColumns.push({
      id: milestone.id,
      name: milestone.title,
      icon: <MilestoneIcon className="w-4 h-4" {...getMilestoneIconProps(milestone.progress_percentage)} />,
      payload: { milestone_id: milestone.id },
    });
  });

  return milestoneColumns;
};

export const getEpicColumns = (): IGroupByColumn[] | undefined => {
  const { projectId, workspaceSlug } = store.router;
  const { isEpicEnabledForProject } = store.issueTypes;

  if (!projectId || !workspaceSlug) return;

  const isEpicFeatureEnabled = isEpicEnabledForProject(workspaceSlug, projectId);

  if (!isEpicFeatureEnabled) return;

  const { getProjectEpicIds, getEpicMetaById } = store.epicBaseStore.epicMetaStore;
  const projectEpicIds = getProjectEpicIds(projectId);

  if (!projectEpicIds) return;

  const epicColumns: IGroupByColumn[] = [
    {
      id: "None",
      name: "None",
      icon: <EpicIcon className="size-4 text-primary" />,
      payload: {},
    },
  ];

  projectEpicIds.forEach((epicId) => {
    const epicMeta = getEpicMetaById(projectId, epicId);
    if (!epicMeta) return;
    epicColumns.push({
      id: epicMeta.id,
      name: `${epicMeta.project_identifier}-${epicMeta.sequence_id} ${epicMeta.name}`,
      icon: <EpicIcon className="size-4 text-primary" />,
      payload: { parent_id: epicMeta.id },
    });
  });

  return epicColumns;
};
