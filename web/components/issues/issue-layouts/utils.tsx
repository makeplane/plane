import { Avatar, CycleGroupIcon, DiceIcon, PriorityIcon, StateGroupIcon } from "@plane/ui";
// stores
import { IMemberRootStore } from "store/member";
import { IProjectStore } from "store/project/project.store";
import { IStateStore } from "store/state.store";
import { ILabelStore } from "store/label.store";
import { ICycleStore } from "store/cycle.store";
import { IModuleStore } from "store/module.store";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// constants
import { STATE_GROUPS } from "constants/state";
import { ISSUE_PRIORITIES } from "constants/issue";
// types
import { GroupByColumnTypes, IGroupByColumn, TCycleGroups } from "@plane/types";
import { ContrastIcon } from "lucide-react";

export const getGroupByColumns = (
  groupBy: GroupByColumnTypes | null,
  project: IProjectStore,
  cycle: ICycleStore,
  module: IModuleStore,
  label: ILabelStore,
  projectState: IStateStore,
  member: IMemberRootStore,
  includeNone?: boolean
): IGroupByColumn[] | undefined => {
  switch (groupBy) {
    case "project":
      return getProjectColumns(project);
    case "cycle":
      return getCycleColumns(project, cycle);
    case "module":
      return getModuleColumns(project, module);
    case "state":
      return getStateColumns(projectState);
    case "state_detail.group":
      return getStateGroupColumns();
    case "priority":
      return getPriorityColumns();
    case "labels":
      return getLabelsColumns(label) as any;
    case "assignees":
      return getAssigneeColumns(member) as any;
    case "created_by":
      return getCreatedByColumns(member) as any;
    default:
      if (includeNone) return [{ id: `null`, name: `All Issues`, payload: {}, icon: undefined }];
  }
};

const getProjectColumns = (project: IProjectStore): IGroupByColumn[] | undefined => {
  const { workspaceProjectIds: projectIds, projectMap } = project;

  if (!projectIds) return;

  return projectIds
    .filter((projectId) => !!projectMap[projectId])
    .map((projectId) => {
      const project = projectMap[projectId];

      return {
        id: project.id,
        name: project.name,
        icon: <div className="w-6 h-6">{renderEmoji(project.emoji || "")}</div>,
        payload: { project_id: project.id },
      };
    }) as any;
};

const getCycleColumns = (projectStore: IProjectStore, cycleStore: ICycleStore): IGroupByColumn[] | undefined => {
  const { currentProjectDetails } = projectStore;
  const { getProjectCycleIds, getCycleById } = cycleStore;

  if (!currentProjectDetails || !currentProjectDetails?.id) return;

  const cycleIds = currentProjectDetails?.id ? getProjectCycleIds(currentProjectDetails?.id) : undefined;
  if (!cycleIds) return;

  const cycles = [];

  cycleIds.map((cycleId) => {
    const cycle = getCycleById(cycleId);
    if (cycle) {
      const cycleStatus = cycle.status ? (cycle.status.toLocaleLowerCase() as TCycleGroups) : "draft";
      cycles.push({
        id: cycle.id,
        name: cycle.name,
        icon: <CycleGroupIcon cycleGroup={cycleStatus as TCycleGroups} className="h-3.5 w-3.5" />,
        payload: { cycle_id: cycle.id },
      });
    }
  });
  cycles.push({
    id: "None",
    name: "None",
    icon: <ContrastIcon className="h-3.5 w-3.5" />,
  });

  return cycles as any;
};

const getModuleColumns = (projectStore: IProjectStore, moduleStore: IModuleStore): IGroupByColumn[] | undefined => {
  const { currentProjectDetails } = projectStore;
  const { getProjectModuleIds, getModuleById } = moduleStore;

  if (!currentProjectDetails || !currentProjectDetails?.id) return;

  const moduleIds = currentProjectDetails?.id ? getProjectModuleIds(currentProjectDetails?.id) : undefined;
  if (!moduleIds) return;

  const modules = [];

  moduleIds.map((moduleId) => {
    const _module = getModuleById(moduleId);
    if (_module)
      modules.push({
        id: _module.id,
        name: _module.name,
        icon: <DiceIcon className="w-3.5 h-3.5" />,
        payload: { module_ids: [_module.id] },
      });
  }) as any;
  modules.push({
    id: "None",
    name: "None",
    icon: <DiceIcon className="w-3.5 h-3.5" />,
  });

  return modules as any;
};

const getStateColumns = (projectState: IStateStore): IGroupByColumn[] | undefined => {
  const { projectStates } = projectState;
  if (!projectStates) return;

  return projectStates.map((state) => ({
    id: state.id,
    name: state.name,
    icon: (
      <div className="w-3.5 h-3.5 rounded-full">
        <StateGroupIcon stateGroup={state.group} color={state.color} width="14" height="14" />
      </div>
    ),
    payload: { state_id: state.id },
  })) as any;
};

const getStateGroupColumns = () => {
  const stateGroups = STATE_GROUPS;

  return Object.values(stateGroups).map((stateGroup) => ({
    id: stateGroup.key,
    name: stateGroup.label,
    icon: (
      <div className="w-3.5 h-3.5 rounded-full">
        <StateGroupIcon stateGroup={stateGroup.key} width="14" height="14" />
      </div>
    ),
    payload: {},
  }));
};

const getPriorityColumns = () => {
  const priorities = ISSUE_PRIORITIES;

  return priorities.map((priority) => ({
    id: priority.key,
    name: priority.title,
    icon: <PriorityIcon priority={priority?.key} />,
    payload: { priority: priority.key },
  }));
};

const getLabelsColumns = (label: ILabelStore) => {
  const { projectLabels } = label;

  if (!projectLabels) return;

  const labels = [...projectLabels, { id: "None", name: "None", color: "#666" }];

  return labels.map((label) => ({
    id: label.id,
    name: label.name,
    icon: (
      <div className="w-[12px] h-[12px] rounded-full" style={{ backgroundColor: label.color ? label.color : "#666" }} />
    ),
    payload: label?.id === "None" ? {} : { label_ids: [label.id] },
  }));
};

const getAssigneeColumns = (member: IMemberRootStore) => {
  const {
    project: { projectMemberIds },
    getUserDetails,
  } = member;

  if (!projectMemberIds) return;

  const assigneeColumns: any = projectMemberIds.map((memberId) => {
    const member = getUserDetails(memberId);
    return {
      id: memberId,
      name: member?.display_name || "",
      icon: <Avatar name={member?.display_name} src={member?.avatar} size="md" />,
      payload: { assignee_ids: [memberId] },
    };
  });

  assigneeColumns.push({ id: "None", name: "None", icon: <Avatar size="md" />, payload: {} });

  return assigneeColumns;
};

const getCreatedByColumns = (member: IMemberRootStore) => {
  const {
    project: { projectMemberIds },
    getUserDetails,
  } = member;

  if (!projectMemberIds) return;

  return projectMemberIds.map((memberId) => {
    const member = getUserDetails(memberId);
    return {
      id: memberId,
      name: member?.display_name || "",
      icon: <Avatar name={member?.display_name} src={member?.avatar} size="md" />,
      payload: {},
    };
  });
};
