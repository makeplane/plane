import { Avatar, PriorityIcon, StateGroupIcon } from "@plane/ui";
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
import { renderEmoji } from "helpers/emoji.helper";
import { ReactElement } from "react";
import { IProjectLabelStore, IProjectMemberStore, IProjectStateStore, IProjectStore } from "store_legacy/project";
import { IIssue } from "types";

export type columnTypes =
  | "project"
  | "state"
  | "state_detail.group"
  | "priority"
  | "labels"
  | "assignees"
  | "created_by";

export interface IKanbanColumn {
  id: string;
  name: string;
  Icon: ReactElement;
  payload: Partial<IIssue>;
}

export const getKanbanColumns = (
  groupBy: columnTypes | null,
  project: IProjectStore,
  projectLabel: IProjectLabelStore,
  projectMember: IProjectMemberStore,
  projectState: IProjectStateStore
): IKanbanColumn[] | undefined => {
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
      return getLabelsColumns(projectLabel);
    case "assignees":
      return getAssigneeColumns(projectMember);
    case "created_by":
      return getCreatedByColumns(projectMember);
  }
};

const getProjectColumns = (project: IProjectStore): IKanbanColumn[] | undefined => {
  const { workspaceProjects: projects } = project;

  if (!projects) return;

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    Icon: <div className="w-6 h-6">{renderEmoji(project.emoji || "")}</div>,
    payload: { project: project.id },
  }));
};

const getStateColumns = (projectState: IProjectStateStore): IKanbanColumn[] | undefined => {
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
  }));
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

const getLabelsColumns = (projectLabel: IProjectLabelStore) => {
  const { projectLabels } = projectLabel;

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

const getAssigneeColumns = (projectMember: IProjectMemberStore) => {
  const { projectMembers: users } = projectMember;
  if (!users) return;

  return users.map((user) => {
    const member = user.member;
    return {
      id: member?.id,
      name: member?.display_name || "",
      Icon: <Avatar name={member?.display_name} src={member?.avatar} size="md" />,
      payload: { assignees: [member?.id] },
    };
  });
};

const getCreatedByColumns = (projectMember: IProjectMemberStore) => {
  const { projectMembers: users } = projectMember;
  if (!users) return;

  return users.map((user) => {
    const member = user.member;
    return {
      id: member?.id,
      name: member?.display_name || "",
      Icon: <Avatar name={member?.display_name} src={member?.avatar} size="md" />,
      payload: { created_by: member?.id },
    };
  });
};
