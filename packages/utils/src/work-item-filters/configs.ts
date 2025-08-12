// plane imports
import { ISSUE_PRIORITIES, STATE_GROUPS, TIssuePriorities } from "@plane/constants";
import {
  EQUALITY_OPERATORS,
  FILTER_TYPE,
  ICycle,
  IIssueLabel,
  IModule,
  IState,
  IUserLite,
  TCreateFilterConfig,
  TCreateFilterConfigParams,
  TCycleGroups,
  TFilterIconConfig,
  TIssueType,
  TStateGroups,
} from "@plane/types";
// local imports
import { createFilterConfig } from "../rich-filters/config";

// ------------ State group filter ------------

/**
 * State group filter specific params
 */
export type TCreateStateGroupFilterParams = TCreateFilterConfigParams & TFilterIconConfig<TStateGroups>;

/**
 * Get the state group filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the state group filter config
 */
export const getStateGroupFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateStateGroupFilterParams> =>
  (params: TCreateStateGroupFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "State Group",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () =>
        Object.values(STATE_GROUPS).map((state) => ({
          id: state.key,
          label: state.label,
          value: state.key,
          icon: params.getOptionIcon?.(state.key),
        })),
    });

// ------------ State filter ------------

/**
 * State filter specific params
 */
export type TCreateStateFilterParams = TCreateFilterConfigParams &
  TFilterIconConfig<IState> & {
    states: IState[];
  };

/**
 * Get the state filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the state filter config
 */
export const getStateFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateStateFilterParams> =>
  (params: TCreateStateFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "State",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () =>
        params.states.map((state) => ({
          id: state.id,
          label: state.name,
          value: state.id,
          icon: params.getOptionIcon?.(state),
        })),
    });

// ------------ Priority filter ------------

/**
 * Priority filter specific params
 */
export type TCreatePriorityFilterParams = TCreateFilterConfigParams & TFilterIconConfig<TIssuePriorities>;

/**
 * Get the priority filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the priority filter config
 */
export const getPriorityFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreatePriorityFilterParams> =>
  (params: TCreatePriorityFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "Priority",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () =>
        ISSUE_PRIORITIES.map((priority) => ({
          id: priority.key,
          label: priority.title,
          value: priority.key,
          icon: params.getOptionIcon?.(priority.key),
        })),
    });

// ------------ Work item type filter ------------

/**
 * Work item type filter specific params
 */
export type TCreateWorkItemTypeFilterParams = TCreateFilterConfigParams &
  TFilterIconConfig<TIssueType> & {
    workItemTypes: TIssueType[];
  };

/**
 * Get the work item type filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the work item type filter config
 */
export const getWorkItemTypeFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateWorkItemTypeFilterParams> =>
  (params: TCreateWorkItemTypeFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "Type",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () =>
        params.workItemTypes
          .filter((type) => type.id && type.name)
          .map((type) => ({
            id: type.id!,
            label: type.name!,
            value: type.id!,
            icon: params.getOptionIcon?.(type),
          })),
    });

// ------------ Cycle filter ------------

/**
 * Cycle filter specific params
 */
export type TCreateCycleFilterParams = TCreateFilterConfigParams &
  TFilterIconConfig<TCycleGroups> & {
    cycles: ICycle[];
  };

/**
 * Get the cycle filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the cycle filter config
 */
export const getCycleFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateCycleFilterParams> =>
  (params: TCreateCycleFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "Cycle",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () =>
        params.cycles.map((cycle) => ({
          id: cycle.id,
          label: cycle.name,
          value: cycle.id,
          icon: params.getOptionIcon?.(cycle.status || "draft"),
        })),
    });

// ------------ Module filter ------------

/**
 * Module filter specific params
 */
export type TCreateModuleFilterParams = TCreateFilterConfigParams &
  TFilterIconConfig<undefined> & {
    modules: IModule[];
  };

/**
 * Get the module filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the module filter config
 */
export const getModuleFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateModuleFilterParams> =>
  (params: TCreateModuleFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "Module",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () =>
        params.modules.map((module) => ({
          id: module.id,
          label: module.name,
          value: module.id,
          icon: params.getOptionIcon?.(undefined),
        })),
    });

// ------------ Label filter ------------

/**
 * Label filter specific params
 */
export type TCreateLabelFilterParams = TCreateFilterConfigParams &
  TFilterIconConfig<string> & {
    labels: IIssueLabel[];
  };

/**
 * Get the label filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the label filter config
 */
export const getLabelFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateLabelFilterParams> =>
  (params: TCreateLabelFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "Label",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () =>
        params.labels.map((label) => ({
          id: label.id,
          label: label.name,
          value: label.id,
          icon: params.getOptionIcon?.(label.color),
        })),
    });

// ------------ User specific filters ------------

/**
 * User filter specific params
 */
export type TCreateUserFilterParams = TCreateFilterConfigParams &
  TFilterIconConfig<IUserLite> & {
    members: IUserLite[];
  };

/**
 * Helper to get member options
 * @param members - The members to get options for
 * @param getOptionIcon - The function to get the icon for the option
 * @returns The member options
 */
const getMemberOptions = (members: IUserLite[], getOptionIcon?: (value: IUserLite) => React.ReactNode) =>
  members.map((member) => ({
    id: member.id,
    label: member.display_name,
    value: member.id,
    icon: getOptionIcon?.(member),
  }));

// ------------ Assignee filter ------------

/**
 * Assignee filter specific params
 */
export type TCreateAssigneeFilterParams = TCreateUserFilterParams;

/**
 * Get the assignee filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the assignee filter config
 */
export const getAssigneeFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateAssigneeFilterParams> =>
  (params: TCreateAssigneeFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "Assignees",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () => getMemberOptions(params.members, params.getOptionIcon),
    });

// ------------ Mention filter ------------

/**
 * Mention filter specific params
 */
export type TCreateMentionFilterParams = TCreateUserFilterParams;

/**
 * Get the mention filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the mention filter config
 */
export const getMentionFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateMentionFilterParams> =>
  (params: TCreateMentionFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "Mentions",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () => getMemberOptions(params.members, params.getOptionIcon),
    });

// ------------ Created by filter ------------

/**
 * Created by filter specific params
 */
export type TCreateCreatedByFilterParams = TCreateUserFilterParams;

/**
 * Get the created by filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the created by filter config
 */
export const getCreatedByFilterConfig =
  <K extends string>(key: K): TCreateFilterConfig<K, TCreateCreatedByFilterParams> =>
  (params: TCreateCreatedByFilterParams) =>
    createFilterConfig<K, typeof FILTER_TYPE.MULTI_SELECT>({
      id: key,
      label: "Created by",
      icon: params.filterIcon,
      type: FILTER_TYPE.MULTI_SELECT,
      isEnabled: params.isEnabled,
      defaultOperator: EQUALITY_OPERATORS.IS,
      defaultValue: [],
      getOptions: () => getMemberOptions(params.members, params.getOptionIcon),
    });
