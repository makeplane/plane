// plane imports
import type { TFilterProperty } from "@plane/types";
import { EQUALITY_OPERATOR, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import type { TCreateFilterConfig, TCreateUserFilterParams } from "../../../rich-filters";
import { createFilterConfig, createOperatorConfigEntry, getMemberMultiSelectConfig } from "../../../rich-filters";

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
    createFilterConfig<P>({
      id: key,
      label: "Assignees",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
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
    createFilterConfig<P>({
      id: key,
      label: "Mentions",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
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
    createFilterConfig<P>({
      id: key,
      label: "Created by",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
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
    createFilterConfig<P>({
      id: key,
      label: "Subscriber",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
