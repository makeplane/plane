/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isNil } from "lodash-es";
// types
import { EIconSize, ISSUE_PRIORITIES } from "@plane/constants";
import { CycleGroupIcon, CycleIcon, ModuleIcon, PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type {
  GroupByColumnTypes,
  IGroupByColumn,
  TCycleGroups,
  IIssueDisplayProperties,
  TGroupedIssues,
} from "@plane/types";
// ui
import { Avatar } from "@plane/ui";
// components
// constants
// stores
import type { ICycleStore } from "@/store/cycle.store";
import type { IIssueLabelStore } from "@/store/label.store";
import type { IIssueMemberStore } from "@/store/members.store";
import type { IIssueModuleStore } from "@/store/module.store";
import type { IStateStore } from "@/store/state.store";

export const HIGHLIGHT_CLASS = "highlight";
export const HIGHLIGHT_WITH_LINE = "highlight-with-line";

type TGroupByLocalizedLabels = {
  allWorkItems: string;
  none: string;
};

export const getGroupByColumns = (
  groupBy: GroupByColumnTypes | null,
  cycle: ICycleStore,
  module: IIssueModuleStore,
  label: IIssueLabelStore,
  projectState: IStateStore,
  member: IIssueMemberStore,
  includeNone?: boolean,
  localizedLabels?: TGroupByLocalizedLabels
): IGroupByColumn[] | undefined => {
  switch (groupBy) {
    case "cycle":
      return getCycleColumns(cycle, localizedLabels);
    case "module":
      return getModuleColumns(module, localizedLabels);
    case "state":
      return getStateColumns(projectState);
    case "priority":
      return getPriorityColumns();
    case "labels":
      return getLabelsColumns(label, localizedLabels) as any;
    case "assignees":
      return getAssigneeColumns(member, localizedLabels);
    case "created_by":
      return getCreatedByColumns(member) as any;
    default:
      if (includeNone)
        return [
          { id: `All Issues`, name: localizedLabels?.allWorkItems ?? `All work items`, payload: {}, icon: undefined },
        ];
  }
};

const getCycleColumns = (
  cycleStore: ICycleStore,
  localizedLabels?: TGroupByLocalizedLabels
): IGroupByColumn[] | undefined => {
  const { cycles } = cycleStore;

  if (!cycles) return;

  const cycleGroups: IGroupByColumn[] = [];

  cycles.map((cycle) => {
    if (cycle) {
      const cycleStatus = cycle?.status ? (cycle.status.toLocaleLowerCase() as TCycleGroups) : "draft";
      cycleGroups.push({
        id: cycle.id,
        name: cycle.name,
        icon: <CycleGroupIcon cycleGroup={cycleStatus} className="h-3.5 w-3.5" />,
        payload: { cycle_id: cycle.id },
      });
    }
  });
  cycleGroups.push({
    id: "None",
    name: localizedLabels?.none ?? "None",
    icon: <CycleIcon className="h-3.5 w-3.5" />,
    payload: { cycle_id: null },
  });

  return cycleGroups;
};

const getModuleColumns = (
  moduleStore: IIssueModuleStore,
  localizedLabels?: TGroupByLocalizedLabels
): IGroupByColumn[] | undefined => {
  const { modules } = moduleStore;

  if (!modules) return;

  const moduleGroups: IGroupByColumn[] = [];

  modules.map((moduleInfo) => {
    if (moduleInfo)
      moduleGroups.push({
        id: moduleInfo.id,
        name: moduleInfo.name,
        icon: <ModuleIcon className="h-3.5 w-3.5" />,
        payload: { module_ids: [moduleInfo.id] },
      });
  }) as any;
  moduleGroups.push({
    id: "None",
    name: localizedLabels?.none ?? "None",
    icon: <ModuleIcon className="h-3.5 w-3.5" />,
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
        <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.MD} />
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

const getLabelsColumns = (labelStore: IIssueLabelStore, localizedLabels?: TGroupByLocalizedLabels) => {
  const { labels: storeLabels } = labelStore;

  if (!storeLabels) return;

  const labels = [...storeLabels, { id: "None", name: localizedLabels?.none ?? "None", color: "#666" }];

  return labels.map((labelInfo) => ({
    id: labelInfo.id,
    name: labelInfo.name,
    icon: (
      <div
        className="h-[12px] w-[12px] rounded-full"
        style={{ backgroundColor: labelInfo.color ? labelInfo.color : "#666" }}
      />
    ),
    payload: labelInfo?.id === "None" ? {} : { label_ids: [labelInfo.id] },
  }));
};

const getAssigneeColumns = (
  memberStore: IIssueMemberStore,
  localizedLabels?: TGroupByLocalizedLabels
): IGroupByColumn[] | undefined => {
  const { members } = memberStore;

  if (!members) return;

  const assigneeColumns: IGroupByColumn[] = members.map((memberInfo) => ({
    id: memberInfo.id,
    name: memberInfo?.member__display_name || "",
    icon: <Avatar name={memberInfo?.member__display_name} src={undefined} size="md" />,
    payload: { assignee_ids: [memberInfo.id] },
  }));

  assigneeColumns.push({ id: "None", name: localizedLabels?.none ?? "None", icon: <Avatar size="md" />, payload: {} });

  return assigneeColumns;
};

const getCreatedByColumns = (memberStore: IIssueMemberStore) => {
  const { members } = memberStore;

  if (!members) return;

  return members.map((memberInfo) => ({
    id: memberInfo.id,
    name: memberInfo?.member__display_name || "",
    icon: <Avatar name={memberInfo?.member__display_name} src={undefined} size="md" />,
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

export const getIssueBlockId = (issueId: string | undefined, groupId: string | undefined, subGroupId?: string) =>
  `issue_${issueId}_${groupId}_${subGroupId}`;

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
