import { Avatar, PriorityIcon, StateGroupIcon } from "@plane/ui";
import { EIssueListRow, ISSUE_PRIORITIES } from "constants/issue";
import { renderEmoji } from "helpers/emoji.helper";
import { IMemberRootStore } from "store/member";
import { IProjectStore } from "store/project/project.store";
import { IStateStore } from "store/state.store";
import { GroupByColumnTypes, IGroupByColumn, IIssueListRow, TGroupedIssues, TUnGroupedIssues } from "@plane/types";
import { STATE_GROUPS } from "constants/state";
import { ILabelStore } from "store/label.store";

export const getGroupByColumns = (
  groupBy: GroupByColumnTypes | null,
  project: IProjectStore,
  label: ILabelStore,
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

export function getIssueFlatList(
  groups: IGroupByColumn[],
  issueIds: TGroupedIssues | TUnGroupedIssues,
  showEmptyGroup: boolean
): IIssueListRow[] | undefined {
  let list: IIssueListRow[] = [];

  if (Array.isArray(issueIds)) {
    return wrapIssuesWithHeaderAndFooter(groups[0], issueIds, showEmptyGroup);
  }

  for (const group of groups) {
    const groupList = wrapIssuesWithHeaderAndFooter(group, issueIds[group.id], showEmptyGroup);

    if (!groupList) continue;

    list = list.concat(groupList);
  }

  return list;
}

function wrapIssuesWithHeaderAndFooter(
  group: IGroupByColumn,
  issueIds: string[],
  showEmptyGroup: boolean
): IIssueListRow[] | undefined {
  const header: IIssueListRow = { ...group, groupId: group.id, type: EIssueListRow.HEADER };
  const quickAdd: IIssueListRow = { ...group, groupId: group.id, type: EIssueListRow.QUICK_ADD };
  if (issueIds && issueIds.length > 0) {
    const list: IIssueListRow[] = [header];

    for (const issueId of issueIds) {
      list.push({ id: issueId, groupId: group.id, type: EIssueListRow.ISSUE });
    }

    list.push(quickAdd);

    return list;
  }

  if (showEmptyGroup) return [header, { id: group.id, groupId: group.id, type: EIssueListRow.NO_ISSUES }, quickAdd];
}