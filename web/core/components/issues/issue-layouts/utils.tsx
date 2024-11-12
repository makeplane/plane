"use client";

import { CSSProperties } from "react";
import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import clone from "lodash/clone";
import concat from "lodash/concat";
import isEqual from "lodash/isEqual";
import isNil from "lodash/isNil";
import pull from "lodash/pull";
import uniq from "lodash/uniq";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { ContrastIcon } from "lucide-react";
// plane types
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TCycleGroups,
  IIssueDisplayProperties,
  IPragmaticDropPayload,
  TIssue,
  TIssueGroupByOptions,
  IIssueFilterOptions,
  IIssueFilters,
  IProjectView,
  TGroupedIssues,
  IWorkspaceView,
} from "@plane/types";
// plane ui
import { Avatar, CycleGroupIcon, DiceIcon, PriorityIcon, StateGroupIcon } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// constants
import { ISSUE_PRIORITIES, EIssuesStoreType } from "@/constants/issue";
import { STATE_GROUPS } from "@/constants/state";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// store
import { ICycleStore } from "@/store/cycle.store";
import { ISSUE_FILTER_DEFAULT_DATA } from "@/store/issue/helpers/base-issues.store";
import { ILabelStore } from "@/store/label.store";
import { IMemberRootStore } from "@/store/member";
import { IModuleStore } from "@/store/module.store";
import { IProjectStore } from "@/store/project/project.store";
import { IStateStore } from "@/store/state.store";

export const HIGHLIGHT_CLASS = "highlight";
export const HIGHLIGHT_WITH_LINE = "highlight-with-line";

export type GroupDropLocation = {
  columnId: string;
  groupId: string;
  subGroupId?: string;
  id: string | undefined;
  canAddIssueBelow?: boolean;
};

export type IssueUpdates = {
  [groupKey: string]: {
    ADD: string[];
    REMOVE: string[];
  };
};

export const isWorkspaceLevel = (type: EIssuesStoreType) =>
  [EIssuesStoreType.PROFILE, EIssuesStoreType.GLOBAL].includes(type) ? true : false;

export const getGroupByColumns = (
  groupBy: GroupByColumnTypes | null,
  project: IProjectStore,
  cycle: ICycleStore,
  module: IModuleStore,
  label: ILabelStore,
  projectState: IStateStore,
  member: IMemberRootStore,
  includeNone?: boolean,
  isWorkspaceLevel?: boolean
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
      return getLabelsColumns(label, isWorkspaceLevel) as any;
    case "assignees":
      return getAssigneeColumns(member) as any;
    case "created_by":
      return getCreatedByColumns(member) as any;
    default:
      if (includeNone) return [{ id: `All Issues`, name: `All Issues`, payload: {}, icon: undefined }];
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
        icon: (
          <div className="w-6 h-6 grid place-items-center flex-shrink-0">
            <Logo logo={project.logo_props} />
          </div>
        ),
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
      const isDropDisabled = cycleStatus === "completed";
      cycles.push({
        id: cycle.id,
        name: cycle.name,
        icon: <CycleGroupIcon cycleGroup={cycleStatus as TCycleGroups} className="h-3.5 w-3.5" />,
        payload: { cycle_id: cycle.id },
        isDropDisabled,
        dropErrorMessage: isDropDisabled ? "Issue cannot be moved to completed cycles" : undefined,
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
    const moduleInfo = getModuleById(moduleId);
    if (moduleInfo)
      modules.push({
        id: moduleInfo.id,
        name: moduleInfo.name,
        icon: <DiceIcon className="h-3.5 w-3.5" />,
        payload: { module_ids: [moduleInfo.id] },
      });
  }) as any;
  modules.push({
    id: "None",
    name: "None",
    icon: <DiceIcon className="h-3.5 w-3.5" />,
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
      <div className="h-3.5 w-3.5 rounded-full">
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
      <div className="h-3.5 w-3.5 rounded-full">
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

const getLabelsColumns = (label: ILabelStore, isWorkspaceLevel: boolean = false) => {
  const { workspaceLabels, projectLabels } = label;

  const labels = [
    ...(isWorkspaceLevel ? workspaceLabels || [] : projectLabels || []),
    { id: "None", name: "None", color: "#666" },
  ];

  return labels.map((label) => ({
    id: label.id,
    name: label.name,
    icon: (
      <div className="h-[12px] w-[12px] rounded-full" style={{ backgroundColor: label.color ? label.color : "#666" }} />
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
      icon: <Avatar name={member?.display_name} src={getFileURL(member?.avatar_url ?? "")} size="md" />,
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
      icon: <Avatar name={member?.display_name} src={getFileURL(member?.avatar_url ?? "")} size="md" />,
      payload: {},
    };
  });
};

export const getDisplayPropertiesCount = (
  displayProperties: IIssueDisplayProperties,
  ignoreFields?: (keyof IIssueDisplayProperties)[]
) => {
  const propertyKeys = Object.keys(displayProperties) as (keyof IIssueDisplayProperties)[];

  let count = 0;

  for (const propertyKey of propertyKeys) {
    if (ignoreFields && ignoreFields.includes(propertyKey)) continue;
    if (displayProperties[propertyKey]) count++;
  }

  return count;
};

/**
 * This Method finds the DOM element with elementId, scrolls to it and highlights the issue block
 * @param elementId
 * @param shouldScrollIntoView
 */
export const highlightIssueOnDrop = (
  elementId: string | undefined,
  shouldScrollIntoView = true,
  shouldHighLightWithLine = false
) => {
  setTimeout(async () => {
    const sourceElementId = elementId ?? "";
    const sourceElement = document.getElementById(sourceElementId);
    sourceElement?.classList?.add(shouldHighLightWithLine ? HIGHLIGHT_WITH_LINE : HIGHLIGHT_CLASS);
    if (shouldScrollIntoView && sourceElement)
      await scrollIntoView(sourceElement, { behavior: "smooth", block: "center", duration: 1500 });
  }, 200);
};

/**
 * get Kanban Source data from Pragmatic Payload
 * @param payload
 * @returns
 */
export const getSourceFromDropPayload = (payload: IPragmaticDropPayload): GroupDropLocation | undefined => {
  const { location, source: sourceIssue } = payload;

  const sourceIssueData = sourceIssue.data;
  let sourceColumData;

  const sourceDropTargets = location?.initial?.dropTargets ?? [];
  for (const dropTarget of sourceDropTargets) {
    const dropTargetData = dropTarget?.data;

    if (!dropTargetData) continue;

    if (dropTargetData.type === "COLUMN") {
      sourceColumData = dropTargetData;
    }
  }

  if (sourceIssueData?.id === undefined || !sourceColumData?.groupId) return;

  return {
    groupId: sourceColumData.groupId as string,
    subGroupId: sourceColumData.subGroupId as string,
    columnId: sourceColumData.columnId as string,
    id: sourceIssueData.id as string,
  };
};

/**
 * get Destination Source data from Pragmatic Payload
 * @param payload
 * @returns
 */
export const getDestinationFromDropPayload = (payload: IPragmaticDropPayload): GroupDropLocation | undefined => {
  const { location } = payload;

  let destinationIssueData, destinationColumnData;

  const destDropTargets = location?.current?.dropTargets ?? [];

  for (const dropTarget of destDropTargets) {
    const dropTargetData = dropTarget?.data;

    if (!dropTargetData) continue;

    if (dropTargetData.type === "COLUMN" || dropTargetData.type === "DELETE") {
      destinationColumnData = dropTargetData;
    }

    if (dropTargetData.type === "ISSUE") {
      destinationIssueData = dropTargetData;
    }
  }

  if (!destinationColumnData?.groupId) return;

  // extract instruction from destination issue
  const extractedInstruction = destinationIssueData ? extractInstruction(destinationIssueData)?.type : "";

  return {
    groupId: destinationColumnData.groupId as string,
    subGroupId: destinationColumnData.subGroupId as string,
    columnId: destinationColumnData.columnId as string,
    id: destinationIssueData?.id as string | undefined,
    canAddIssueBelow: extractedInstruction === "reorder-below",
  };
};

/**
 * Returns Sort order of the issue block at the position of drop
 * @param destinationIssues
 * @param destinationIssueId
 * @param getIssueById
 * @returns
 */
const handleSortOrder = (
  destinationIssues: string[],
  destinationIssueId: string | undefined,
  getIssueById: (issueId: string) => TIssue | undefined,
  shouldAddIssueAtTop = false,
  canAddIssueBelow = false
) => {
  const sortOrderDefaultValue = 65535;
  let currentIssueState = {};

  let destinationIndex = destinationIssueId
    ? destinationIssues.indexOf(destinationIssueId)
    : shouldAddIssueAtTop
      ? 0
      : destinationIssues.length;

  const isDestinationLastChild = destinationIndex === destinationIssues.length - 1;

  // if issue can be added below and if the destination issue is the last child, then add to the end of the list
  if (canAddIssueBelow && isDestinationLastChild) {
    destinationIndex = destinationIssues.length;
  }

  if (destinationIssues && destinationIssues.length > 0) {
    if (destinationIndex === 0) {
      const destinationIssueId = destinationIssues[0];
      const destinationIssue = getIssueById(destinationIssueId);
      if (!destinationIssue) return currentIssueState;

      currentIssueState = {
        ...currentIssueState,
        sort_order: destinationIssue.sort_order - sortOrderDefaultValue,
      };
    } else if (destinationIndex === destinationIssues.length) {
      const destinationIssueId = destinationIssues[destinationIssues.length - 1];
      const destinationIssue = getIssueById(destinationIssueId);
      if (!destinationIssue) return currentIssueState;

      currentIssueState = {
        ...currentIssueState,
        sort_order: destinationIssue.sort_order + sortOrderDefaultValue,
      };
    } else {
      const destinationTopIssueId = destinationIssues[destinationIndex - 1];
      const destinationBottomIssueId = destinationIssues[destinationIndex];

      const destinationTopIssue = getIssueById(destinationTopIssueId);
      const destinationBottomIssue = getIssueById(destinationBottomIssueId);
      if (!destinationTopIssue || !destinationBottomIssue) return currentIssueState;

      currentIssueState = {
        ...currentIssueState,
        sort_order: (destinationTopIssue.sort_order + destinationBottomIssue.sort_order) / 2,
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

export const getIssueBlockId = (
  issueId: string | undefined,
  groupId: string | undefined,
  subGroupId?: string | undefined
) => `issue_${issueId}_${groupId}_${subGroupId}`;

/**
 * returns empty Array if groupId is None
 * @param groupId
 * @returns
 */
const getGroupId = (groupId: string) => {
  if (groupId === "None") return [];
  return [groupId];
};

export const handleGroupDragDrop = async (
  source: GroupDropLocation,
  destination: GroupDropLocation,
  getIssueById: (issueId: string) => TIssue | undefined,
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined,
  updateIssueOnDrop: (projectId: string, issueId: string, data: Partial<TIssue>, issueUpdates: IssueUpdates) => void,
  groupBy: TIssueGroupByOptions | undefined,
  subGroupBy: TIssueGroupByOptions | undefined,
  shouldAddIssueAtTop = false
) => {
  if (!source.id || !groupBy || (subGroupBy && (!source.subGroupId || !destination.subGroupId))) return;

  let updatedIssue: Partial<TIssue> = {};
  const issueUpdates: IssueUpdates = {};
  const destinationIssues = getIssueIds(destination.groupId, destination.subGroupId) ?? [];

  const sourceIssue = getIssueById(source.id);

  if (!sourceIssue) return;

  updatedIssue = {
    id: sourceIssue.id,
    project_id: sourceIssue.project_id,
  };

  // for both horizontal and vertical dnd
  updatedIssue = {
    ...updatedIssue,
    ...handleSortOrder(
      destinationIssues,
      destination.id,
      getIssueById,
      shouldAddIssueAtTop,
      !!destination.canAddIssueBelow
    ),
  };

  // update updatedIssue values based on the source and destination groupIds
  if (source.groupId && destination.groupId && source.groupId !== destination.groupId) {
    const groupKey = ISSUE_FILTER_DEFAULT_DATA[groupBy];
    let groupValue: any = clone(sourceIssue[groupKey]);

    // If groupValues is an array, remove source groupId and add destination groupId
    if (Array.isArray(groupValue)) {
      pull(groupValue, source.groupId);
      if (destination.groupId !== "None") groupValue = uniq(concat(groupValue, [destination.groupId]));
    } // else just update the groupValue based on destination groupId
    else {
      groupValue = destination.groupId === "None" ? null : destination.groupId;
    }

    // keep track of updates on what was added and what was removed
    issueUpdates[groupKey] = { ADD: getGroupId(destination.groupId), REMOVE: getGroupId(source.groupId) };
    updatedIssue = { ...updatedIssue, [groupKey]: groupValue };
  }

  // do the same for subgroup
  // update updatedIssue values based on the source and destination subGroupIds
  if (subGroupBy && source.subGroupId && destination.subGroupId && source.subGroupId !== destination.subGroupId) {
    const subGroupKey = ISSUE_FILTER_DEFAULT_DATA[subGroupBy];
    let subGroupValue: any = clone(sourceIssue[subGroupKey]);

    // If subGroupValue is an array, remove source subGroupId and add destination subGroupId
    if (Array.isArray(subGroupValue)) {
      pull(subGroupValue, source.subGroupId);
      if (destination.subGroupId !== "None") subGroupValue = uniq(concat(subGroupValue, [destination.subGroupId]));
    } // else just update the subGroupValue based on destination subGroupId
    else {
      subGroupValue = destination.subGroupId === "None" ? null : destination.subGroupId;
    }

    // keep track of updates on what was added and what was removed
    issueUpdates[subGroupKey] = { ADD: getGroupId(destination.subGroupId), REMOVE: getGroupId(source.subGroupId) };
    updatedIssue = { ...updatedIssue, [subGroupKey]: subGroupValue };
  }

  if (updatedIssue && sourceIssue?.project_id) {
    return await updateIssueOnDrop(sourceIssue?.project_id, sourceIssue.id, updatedIssue, issueUpdates);
  }
};

/**
 * This Method compares filters and returns a boolean based on which and updateView button is shown
 * @param appliedFilters
 * @param issueFilters
 * @param viewDetails
 * @returns
 */
export const getAreFiltersEqual = (
  appliedFilters: IIssueFilterOptions | undefined,
  issueFilters: IIssueFilters | undefined,
  viewDetails: IProjectView | IWorkspaceView | null
) => {
  if (isNil(appliedFilters) || isNil(issueFilters) || isNil(viewDetails)) return true;

  return (
    isEqual(appliedFilters, viewDetails.filters) &&
    isEqual(issueFilters.displayFilters, viewDetails.display_filters) &&
    isEqual(removeNillKeys(issueFilters.displayProperties), removeNillKeys(viewDetails.display_properties))
  );
};

/**
 * method that removes Null or undefined Keys from object
 * @param obj
 * @returns
 */
export const removeNillKeys = <T,>(obj: T) =>
  Object.fromEntries(Object.entries(obj ?? {}).filter(([key, value]) => key && !isNil(value)));

/**
 * This Method returns if the the grouped values are subGrouped
 * @param groupedIssueIds
 * @returns
 */
export const isSubGrouped = (groupedIssueIds: TGroupedIssues) => {
  if (!groupedIssueIds || Array.isArray(groupedIssueIds)) {
    return false;
  }

  if (Array.isArray(groupedIssueIds[Object.keys(groupedIssueIds)[0]])) {
    return false;
  }

  return true;
};

/**
 * This Method returns if the issue is new or not
 * @param issue
 * @returns
 */
export const isIssueNew = (issue: TIssue) => {
  const createdDate = new Date(issue.created_at);
  const currentDate = new Date();
  const diff = currentDate.getTime() - createdDate.getTime();
  return diff < 30000;
};

/**
 * Returns approximate height of Kanban card based on display properties
 * @param displayProperties
 * @returns
 */
export function getApproximateCardHeight(displayProperties: IIssueDisplayProperties | undefined) {
  if (!displayProperties) return 100;

  // default card height
  let cardHeight = 46;

  const clonedProperties = clone(displayProperties);

  // key adds the height for key
  if (clonedProperties.key) {
    cardHeight += 24;
  }

  // Ignore smaller dimension properties
  const ignoredProperties: (keyof IIssueDisplayProperties)[] = [
    "key",
    "sub_issue_count",
    "link",
    "attachment_count",
    "created_on",
    "updated_on",
  ];

  ignoredProperties.forEach((key: keyof IIssueDisplayProperties) => {
    delete clonedProperties[key];
  });

  let propertyCount = 0;

  // count the remaining properties
  (Object.keys(clonedProperties) as (keyof IIssueDisplayProperties)[]).forEach((key: keyof IIssueDisplayProperties) => {
    if (clonedProperties[key]) {
      propertyCount++;
    }
  });

  // based on property count, approximate the height of each card
  if (propertyCount > 3) {
    cardHeight += 60;
  } else if (propertyCount > 0) {
    cardHeight += 32;
  }

  return cardHeight;
}

/**
 * This Method is used to get Block view details, that returns block style and tooltip message
 * @param block
 * @param backgroundColor
 * @returns
 */
export const getBlockViewDetails = (
  block: { start_date: string | undefined | null; target_date: string | undefined | null } | undefined | null,
  backgroundColor: string
) => {
  const isBlockVisibleOnChart = block?.start_date || block?.target_date;
  const isBlockComplete = block?.start_date && block?.target_date;

  let message;
  const blockStyle: CSSProperties = {
    backgroundColor,
  };

  if (isBlockVisibleOnChart && !isBlockComplete) {
    if (block?.start_date) {
      message = `From ${renderFormattedDate(block.start_date)}`;
      blockStyle.maskImage = `linear-gradient(to right, ${backgroundColor} 50%, transparent 95%)`;
    } else if (block?.target_date) {
      message = `Till ${renderFormattedDate(block.target_date)}`;
      blockStyle.maskImage = `linear-gradient(to left, ${backgroundColor} 50%, transparent 95%)`;
    }
  } else if (isBlockComplete) {
    message = `${renderFormattedDate(block?.start_date)} to ${renderFormattedDate(block?.target_date)}`;
  }

  return {
    message,
    blockStyle,
  };
};
