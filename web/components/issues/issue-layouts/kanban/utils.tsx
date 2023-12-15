import { DraggableLocation } from "@hello-pangea/dnd";
import { Avatar, PriorityIcon, StateGroupIcon } from "@plane/ui";
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
import { renderEmoji } from "helpers/emoji.helper";
import { ReactElement } from "react";
import { IIssueStore } from "store/issue/issue.store";
import { IProjectIssues } from "store/issue/project";
import { ILabelRootStore } from "store/label";
import { IProjectStore } from "store/project/project.store";
import { IStateStore } from "store/state.store";
import { IGroupedIssues, IIssue, ISubGroupedIssues, TUnGroupedIssues } from "types";

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
  projectLabel: ILabelRootStore,
  projectState: IStateStore
  //projectMember?: IProjectMemberStore,
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
    // case "assignees":
    //   return getAssigneeColumns(projectMember);
    // case "created_by":
    //   return getCreatedByColumns(projectMember);
  }
};

const getProjectColumns = (project: IProjectStore): IKanbanColumn[] | undefined => {
  const { workspaceProjects: projectIds, projectMap } = project;

  if (!projectIds) return;

  return projectIds.map((projectId) => {
    const project = projectMap[projectId];

    if (project)
      return {
        id: project.id,
        name: project.name,
        Icon: <div className="w-6 h-6">{renderEmoji(project.emoji || "")}</div>,
        payload: { project: project.id },
      };
  });
};

const getStateColumns = (projectState: IStateStore): IKanbanColumn[] | undefined => {
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

// const getAssigneeColumns = (projectMember: IProjectMemberStore) => {
//   const { projectMembers: users } = projectMember;
//   if (!users) return;

//   return users.map((user) => {
//     const member = user.member;
//     return {
//       id: member?.id,
//       name: member?.display_name || "",
//       Icon: <Avatar name={member?.display_name} src={member?.avatar} size="md" />,
//       payload: { assignees: [member?.id] },
//     };
//   });
// };

// const getCreatedByColumns = (projectMember: IProjectMemberStore) => {
//   const { projectMembers: users } = projectMember;
//   if (!users) return;

//   return users.map((user) => {
//     const member = user.member;
//     return {
//       id: member?.id,
//       name: member?.display_name || "",
//       Icon: <Avatar name={member?.display_name} src={member?.avatar} size="md" />,
//       payload: { created_by: member?.id },
//     };
//   });
// };

export const handleDragDrop = async (
  source: DraggableLocation | null,
  destination: DraggableLocation | null,
  workspaceSlug: string,
  projectId: string, // projectId for all views or user id in profile issues
  store: IProjectIssues,
  subGroupBy: string | null,
  groupBy: string | null,
  issueMap: IIssueStore | undefined,
  issueWithIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined,
  viewId: string | null = null // it can be moduleId, cycleId
) => {
  if (!issueMap || !issueWithIds || !source || !destination) return;

  let updateIssue: any = {};

  const sourceColumnId = (source?.droppableId && source?.droppableId.split("__")) || null;
  const destinationColumnId = (destination?.droppableId && destination?.droppableId.split("__")) || null;

  if (!sourceColumnId || !destinationColumnId) return;

  const sourceGroupByColumnId = sourceColumnId[0] || null;
  const destinationGroupByColumnId = destinationColumnId[0] || null;

  const sourceSubGroupByColumnId = sourceColumnId[1] || null;
  const destinationSubGroupByColumnId = destinationColumnId[1] || null;

  if (
    !workspaceSlug ||
    !projectId ||
    !groupBy ||
    !sourceGroupByColumnId ||
    !destinationGroupByColumnId ||
    !sourceSubGroupByColumnId ||
    !sourceGroupByColumnId
  )
    return;

  if (destinationGroupByColumnId === "issue-trash-box") {
    const sourceIssues: string[] = subGroupBy
      ? (issueWithIds as ISubGroupedIssues)[sourceSubGroupByColumnId][sourceGroupByColumnId]
      : (issueWithIds as IGroupedIssues)[sourceGroupByColumnId];

    const [removed] = sourceIssues.splice(source.index, 1);

    if (removed) {
      if (viewId) return await store?.removeIssue(workspaceSlug, projectId, removed); //, viewId);
      else return await store?.removeIssue(workspaceSlug, projectId, removed);
    }
  } else {
    const sourceIssues = subGroupBy
      ? (issueWithIds as ISubGroupedIssues)[sourceSubGroupByColumnId][sourceGroupByColumnId]
      : (issueWithIds as IGroupedIssues)[sourceGroupByColumnId];
    const destinationIssues = subGroupBy
      ? (issueWithIds as ISubGroupedIssues)[sourceSubGroupByColumnId][destinationGroupByColumnId]
      : (issueWithIds as IGroupedIssues)[destinationGroupByColumnId];

    const [removed] = sourceIssues.splice(source.index, 1);
    const removedIssueDetail = issueMap.allIssues[removed];

    if (subGroupBy && sourceSubGroupByColumnId && destinationSubGroupByColumnId) {
      updateIssue = {
        id: removedIssueDetail?.id,
      };

      // for both horizontal and vertical dnd
      updateIssue = {
        ...updateIssue,
        ...handleSortOrder(destinationIssues, destination.index, issueMap),
      };

      if (sourceSubGroupByColumnId === destinationSubGroupByColumnId) {
        if (sourceGroupByColumnId != destinationGroupByColumnId) {
          if (groupBy === "state") updateIssue = { ...updateIssue, state: destinationGroupByColumnId };
          if (groupBy === "priority") updateIssue = { ...updateIssue, priority: destinationGroupByColumnId };
        }
      } else {
        if (subGroupBy === "state")
          updateIssue = {
            ...updateIssue,
            state: destinationSubGroupByColumnId,
            priority: destinationGroupByColumnId,
          };
        if (subGroupBy === "priority")
          updateIssue = {
            ...updateIssue,
            state: destinationGroupByColumnId,
            priority: destinationSubGroupByColumnId,
          };
      }
    } else {
      updateIssue = {
        id: removedIssueDetail?.id,
      };

      // for both horizontal and vertical dnd
      updateIssue = {
        ...updateIssue,
        ...handleSortOrder(destinationIssues, destination.index, issueMap),
      };

      // for horizontal dnd
      if (sourceColumnId != destinationColumnId) {
        if (groupBy === "state") updateIssue = { ...updateIssue, state: destinationGroupByColumnId };
        if (groupBy === "priority") updateIssue = { ...updateIssue, priority: destinationGroupByColumnId };
      }
    }

    if (updateIssue && updateIssue?.id) {
      if (viewId) return await store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue); //, viewId);
      else return await store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue);
    }
  }
};

const handleSortOrder = (destinationIssues: string[], destinationIndex: number, issueMap: IIssueStore) => {
  const sortOrderDefaultValue = 65535;
  let currentIssueState = {};

  if (destinationIssues && destinationIssues.length > 0) {
    if (destinationIndex === 0) {
      const destinationIssueId = destinationIssues[destinationIndex];
      currentIssueState = {
        ...currentIssueState,
        sort_order: issueMap.allIssues[destinationIssueId].sort_order - sortOrderDefaultValue,
      };
    } else if (destinationIndex === destinationIssues.length) {
      const destinationIssueId = destinationIssues[destinationIndex - 1];
      currentIssueState = {
        ...currentIssueState,
        sort_order: issueMap.allIssues[destinationIssueId].sort_order + sortOrderDefaultValue,
      };
    } else {
      const destinationTopIssueId = destinationIssues[destinationIndex - 1];
      const destinationBottomIssueId = destinationIssues[destinationIndex];
      currentIssueState = {
        ...currentIssueState,
        sort_order:
          (issueMap.allIssues[destinationTopIssueId].sort_order +
            issueMap.allIssues[destinationBottomIssueId].sort_order) /
          2,
      };
    }
  } else {
    currentIssueState = {
      ...currentIssueState,
      sort_order: sortOrderDefaultValue,
    };
  }

  return currentIssueState;
};
