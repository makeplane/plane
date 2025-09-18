// plane imports
import { EQUALITY_OPERATOR, IUserLite, TFilterProperty, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import {
  createFilterConfig,
  TCreateFilterConfigParams,
  IFilterIconConfig,
  TCreateFilterConfig,
  getMultiSelectConfig,
  createOperatorConfigEntry,
} from "../../../rich-filters";

// ------------ Base User Filter Types ------------

/**
 * User filter specific params
 */
export type TCreateUserFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<IUserLite> & {
    members: IUserLite[];
  };

/**
 * Helper to get the member multi select config
 * @param params - The filter params
 * @returns The member multi select config
 */
export const getMemberMultiSelectConfig = (params: TCreateUserFilterParams) =>
  getMultiSelectConfig<IUserLite, string, IUserLite>(
    {
      items: params.members,
      getId: (member) => member.id,
      getLabel: (member) => member.display_name,
      getValue: (member) => member.id,
      getIconData: (member) => member,
    },
    {
      singleValueOperator: EQUALITY_OPERATOR.EXACT,
      ...params,
    },
    {
      ...params,
    }
  );

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
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateAssigneeFilterParams> =>
  (params: TCreateAssigneeFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Assignees",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams)
        ),
      ]),
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
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateMentionFilterParams> =>
  (params: TCreateMentionFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Mentions",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams)
        ),
      ]),
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
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateCreatedByFilterParams> =>
  (params: TCreateCreatedByFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Created by",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams)
        ),
      ]),
    });

// ------------ Subscriber filter ------------

/**
 * Subscriber filter specific params
 */
export type TCreateSubscriberFilterParams = TCreateUserFilterParams;

/**
 * Get the subscriber filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the subscriber filter config
 */
export const getSubscriberFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateSubscriberFilterParams> =>
  (params: TCreateSubscriberFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Subscriber",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams)
        ),
      ]),
    });
