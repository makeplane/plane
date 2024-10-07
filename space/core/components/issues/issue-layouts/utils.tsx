"use client";

import isNil from "lodash/isNil";
import { ContrastIcon } from "lucide-react";
// types
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TCycleGroups,
  IIssueDisplayProperties,
  TGroupedIssues,
} from "@plane/types";
// ui
import { Avatar, CycleGroupIcon, DiceIcon, PriorityIcon, StateGroupIcon } from "@plane/ui";
// components
// constants
import { ISSUE_PRIORITIES } from "@/constants/issue";
// stores
import { ICycleStore } from "@/store/cycle.store";
import { IIssueLabelStore } from "@/store/label.store";
import { IIssueMemberStore } from "@/store/members.store";
import { IIssueModuleStore } from "@/store/module.store";
import { IStateStore } from "@/store/state.store";

export const HIGHLIGHT_CLASS = "highlight";
export const HIGHLIGHT_WITH_LINE = "highlight-with-line";

export const getGroupByColumns = (
  groupBy: GroupByColumnTypes | null,
  cycle: ICycleStore,
  module: IIssueModuleStore,
  label: IIssueLabelStore,
  projectState: IStateStore,
  member: IIssueMemberStore,
  includeNone?: boolean
): IGroupByColumn[] | undefined => {
  switch (groupBy) {
    case "cycle":
      return getCycleColumns(cycle);
    case "module":
      return getModuleColumns(module);
    case "state":
      return getStateColumns(projectState);
    case "priority":
      return getPriorityColumns();
    case "labels":
      return getLabelsColumns(label) as any;
    case "assignees":
      return getAssigneeColumns(member) as any;
    case "created_by":
      return getCreatedByColumns(member) as any;
    default:
      if (includeNone) return [{ id: `All Issues`, name: `All Issues`, payload: {}, icon: undefined }];
  }
};

const getCycleColumns = (cycleStore: ICycleStore): IGroupByColumn[] | undefined => {
  const { cycles } = cycleStore;

  if (!cycles) return;

  const cycleGroups: IGroupByColumn[] = [];

  cycles.map((cycle) => {
    if (cycle) {
      const cycleStatus = cycle?.status ? (cycle.status.toLocaleLowerCase() as TCycleGroups) : "draft";
      cycleGroups.push({
        id: cycle.id,
        name: cycle.name,
        icon: <CycleGroupIcon cycleGroup={cycleStatus as TCycleGroups} className="h-3.5 w-3.5" />,
        payload: { cycle_id: cycle.id },
      });
    }
  });
  cycleGroups.push({
    id: "None",
    name: "None",
    icon: <ContrastIcon className="h-3.5 w-3.5" />,
    payload: { cycle_id: null },
  });

  return cycleGroups;
};

const getModuleColumns = (moduleStore: IIssueModuleStore): IGroupByColumn[] | undefined => {
  const { modules } = moduleStore;

  if (!modules) return;

  const moduleGroups: IGroupByColumn[] = [];

  modules.map((moduleInfo) => {
    if (moduleInfo)
      moduleGroups.push({
        id: moduleInfo.id,
        name: moduleInfo.name,
        icon: <DiceIcon className="h-3.5 w-3.5" />,
        payload: { module_ids: [moduleInfo.id] },
      });
  }) as any;
  moduleGroups.push({
    id: "None",
    name: "None",
    icon: <DiceIcon className="h-3.5 w-3.5" />,
    payload: { module_ids: [] },
  });

  return moduleGroups as any;
};

const getStateColumns = (projectState: IStateStore): IGroupByColumn[] | undefined => {
  const { sortedStates } = projectState;
  if (!sortedStates) return;

  return sortedStates.map((state) => ({
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

const getPriorityColumns = () => {
  const priorities = ISSUE_PRIORITIES;

  return priorities.map((priority) => ({
    id: priority.key,
    name: priority.title,
    icon: <PriorityIcon priority={priority?.key} />,
    payload: { priority: priority.key },
  }));
};

const getLabelsColumns = (label: IIssueLabelStore) => {
  const { labels: storeLabels } = label;

  if (!storeLabels) return;

  const labels = [...storeLabels, { id: "None", name: "None", color: "#666" }];

  return labels.map((label) => ({
    id: label.id,
    name: label.name,
    icon: (
      <div className="h-[12px] w-[12px] rounded-full" style={{ backgroundColor: label.color ? label.color : "#666" }} />
    ),
    payload: label?.id === "None" ? {} : { label_ids: [label.id] },
  }));
};

const getAssigneeColumns = (member: IIssueMemberStore) => {
  const { members } = member;

  if (!members) return;

  const assigneeColumns: any = members.map((member) => ({
    id: member.id,
    name: member?.member__display_name || "",
    icon: <Avatar name={member?.member__display_name} src={undefined} size="md" />,
    payload: { assignee_ids: [member.id] },
  }));

  assigneeColumns.push({ id: "None", name: "None", icon: <Avatar size="md" />, payload: {} });

  return assigneeColumns;
};

const getCreatedByColumns = (member: IIssueMemberStore) => {
  const { members } = member;

  if (!members) return;

  return members.map((member) => ({
    id: member.id,
    name: member?.member__display_name || "",
    icon: <Avatar name={member?.member__display_name} src={undefined} size="md" />,
    payload: {},
  }));
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
export const getGroupId = (groupId: string) => {
  if (groupId === "None") return [];
  return [groupId];
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
