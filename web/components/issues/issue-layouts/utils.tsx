import { Avatar, PriorityIcon, StateGroupIcon } from "@plane/ui";
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
import { renderEmoji } from "helpers/emoji.helper";
import { ILabelRootStore } from "store/label";
import { IMemberRootStore } from "store/member";
import { IProjectStore } from "store/project/project.store";
import { IStateStore } from "store/state.store";
import { GroupByColumnTypes, IGroupByColumn } from "@plane/types";

export const getGroupByColumns = (
  groupBy: GroupByColumnTypes | null,
  project: IProjectStore,
  projectLabel: ILabelRootStore,
  projectState: IStateStore,
  member: IMemberRootStore,
  includeNone?: boolean
): IGroupByColumn[] | undefined => {
  switch (groupBy) {
    case "project":
      return getProjectColumns(project);
    case "state":
      return getStateColumns(projectState);
    case "state_detail.group":
      return getStateGroupColumns();
    case "priority":
      return getPriorityColumns();
    case "labels":
      return getLabelsColumns(projectLabel) as any;
    case "assignees":
      return getAssigneeColumns(member) as any;
    case "created_by":
      return getCreatedByColumns(member) as any;
    default:
      if (includeNone) return [{ id: `null`, name: `All Issues`, payload: {}, Icon: undefined }];
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
        Icon: <div className="w-6 h-6">{renderEmoji(project.emoji || "")}</div>,
        payload: { project: project.id },
      };
    }) as any;
};

const getStateColumns = (projectState: IStateStore): IGroupByColumn[] | undefined => {
  const { projectStates } = projectState;
  if (!projectStates) return;

  return projectStates.map((state) => ({
    id: state.id,
    name: state.name,
    Icon: (
      <div className="w-3.5 h-3.5 rounded-full">
        <StateGroupIcon stateGroup={state.group} color={state.color} width="14" height="14" />
      </div>
    ),
    payload: { state: state.id },
  })) as any;
};

const getStateGroupColumns = () => {
  const stateGroups = ISSUE_STATE_GROUPS;

  return stateGroups.map((stateGroup) => ({
    id: stateGroup.key,
    name: stateGroup.title,
    Icon: (
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
    Icon: <PriorityIcon priority={priority?.key} />,
    payload: { priority: priority.key },
  }));
};

const getLabelsColumns = (projectLabel: ILabelRootStore) => {
  const {
    project: { projectLabels },
  } = projectLabel;

  if (!projectLabels) return;

  const labels = [...projectLabels, { id: "None", name: "None", color: "#666" }];

  return labels.map((label) => ({
    id: label.id,
    name: label.name,
    Icon: (
      <div className="w-[12px] h-[12px] rounded-full" style={{ backgroundColor: label.color ? label.color : "#666" }} />
    ),
    payload: { labels: [label.id] },
  }));
};

const getAssigneeColumns = (member: IMemberRootStore) => {
  const {
    project: { projectMemberIds },
    getUserDetails,
  } = member;

  if (!projectMemberIds) return;

  const assigneeColumns = projectMemberIds.map((memberId) => {
    const member = getUserDetails(memberId);
    return {
      id: memberId,
      name: member?.display_name || "",
      Icon: <Avatar name={member?.display_name} src={member?.avatar} size="md" />,
      payload: { assignees: [memberId] },
    };
  });

  assigneeColumns.push({ id: "None", name: "None", Icon: <Avatar size="md" />, payload: { assignees: [""] } });

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
      Icon: <Avatar name={member?.display_name} src={member?.avatar} size="md" />,
      payload: { assignees: [memberId] },
    };
  });
};
