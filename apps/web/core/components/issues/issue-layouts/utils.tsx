import type { CSSProperties, FC } from "react";
import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { clone, isNil, pull, uniq, concat } from "lodash-es";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
// plane types
import { EIconSize, ISSUE_PRIORITIES, STATE_GROUPS } from "@plane/constants";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { ISvgIcons } from "@plane/propel/icons";
import { CycleGroupIcon, CycleIcon, ModuleIcon, PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type {
  GroupByColumnTypes,
  IGroupByColumn,
  TCycleGroups,
  IIssueDisplayProperties,
  IPragmaticDropPayload,
  TIssue,
  TIssueGroupByOptions,
  IIssueFilterOptions,
  IIssueFilters,
  TGroupedIssues,
  IIssueDisplayFilterOptions,
  TGetColumns,
} from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// plane ui
import { Avatar } from "@plane/ui";
import { renderFormattedDate, getFileURL } from "@plane/utils";
// helpers
// store
import { store } from "@/lib/store-context";
// plane web store
import {
  getScopeMemberIds,
  getTeamProjectColumns,
  SpreadSheetPropertyIconMap,
} from "@/plane-web/components/issues/issue-layouts/utils";
// store
import { ISSUE_FILTER_DEFAULT_DATA } from "@/store/issue/helpers/base-issues.store";
import { DEFAULT_DISPLAY_PROPERTIES } from "@/store/issue/issue-details/sub_issues_filter.store";

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
  [
    EIssuesStoreType.PROFILE,
    EIssuesStoreType.GLOBAL,
    EIssuesStoreType.TEAM,
    EIssuesStoreType.TEAM_VIEW,
    EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS,
    EIssuesStoreType.WORKSPACE_DRAFT,
  ].includes(type)
    ? true
    : false;

type TGetGroupByColumns = {
  groupBy: GroupByColumnTypes | null;
  includeNone: boolean;
  isWorkspaceLevel: boolean;
  isEpic?: boolean;
  projectId?: string;
};

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

const getCreatedByColumns = (): IGroupByColumn[] | undefined => {
  const {
    project: { projectMemberIds },
    getUserDetails,
  } = store.memberRoot;
  if (!projectMemberIds) return;
  // Map project member ids to group by created by columns
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

export const getIssueBlockId = (issueId: string | undefined, groupId: string | undefined, subGroupId?: string) =>
  `issue_${issueId}_${groupId}_${subGroupId}`;

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
  if (!source.id || (subGroupBy && (!source.subGroupId || !destination.subGroupId))) return;

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
  if (source.groupId && destination.groupId && source.groupId !== destination.groupId && groupBy) {
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
 * method that removes Null or undefined Keys from object
 * @param obj
 * @returns
 */
export const removeNillKeys = <T,>(obj: T) =>
  Object.fromEntries(Object.entries(obj ?? {}).filter(([key, value]) => key && !isNil(value)));

/**
 * This Method returns if the grouped values are subGrouped
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

/**
 * This method returns the icon for Spreadsheet column headers
 * @param iconKey
 */
export function SpreadSheetPropertyIcon(props: ISvgIcons & { iconKey: string }) {
  const { iconKey } = props;
  const Icon = SpreadSheetPropertyIconMap[iconKey];
  if (!Icon) return null;
  return <Icon {...props} />;
}

/**
 * This method returns if the filters are applied
 * @param filters
 * @returns
 */
export const isDisplayFiltersApplied = (filters: Partial<IIssueFilters>): boolean => {
  const isDisplayPropertiesApplied = Object.keys(DEFAULT_DISPLAY_PROPERTIES).some(
    (key) => !filters.displayProperties?.[key as keyof IIssueDisplayProperties]
  );

  const isDisplayFiltersApplied = Object.keys(filters.displayFilters ?? {}).some((key) => {
    const value = filters.displayFilters?.[key as keyof IIssueDisplayFilterOptions];
    if (!value) return false;
    // -create_at is the default order
    if (key === "order_by") {
      return value !== "-created_at";
    }
    return true;
  });

  return isDisplayPropertiesApplied || isDisplayFiltersApplied;
};

/**
 * This method returns if the filters are applied
 * @param filters
 * @returns
 */
export const isFiltersApplied = (filters: IIssueFilterOptions): boolean =>
  Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });

/**
 * Calculates the minimum width needed for issue identifiers in list layouts
 * @param projectIdentifierLength - Length of the project identifier (e.g., "PROJ" = 4)
 * @param maxSequenceId - Maximum sequence ID in the project (e.g., 1234)
 * @returns Width in pixels needed to display the identifier
 *
 * @example
 * // For "PROJ-1234"
 * calculateIdentifierWidth(4, 1234) // Returns width for "PROJ" + "-" + "1234"
 */
export const calculateIdentifierWidth = (projectIdentifierLength: number, maxSequenceId: number): number => {
  const sequenceDigits = Math.max(1, Math.floor(Math.log10(maxSequenceId)) + 1);
  return projectIdentifierLength * 7 + 7 + sequenceDigits * 7; // project identifier chars + dash + sequence digits
};
