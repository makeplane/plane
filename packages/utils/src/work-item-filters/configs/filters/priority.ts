// plane imports
import { ISSUE_PRIORITIES, TIssuePriorities } from "@plane/constants";
import { EQUALITY_OPERATOR, TFilterProperty, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import {
  createFilterConfig,
  TCreateFilterConfigParams,
  IFilterIconConfig,
  TCreateFilterConfig,
  getMultiSelectConfig,
} from "../../../rich-filters";

// ------------ Priority filter ------------

/**
 * Priority filter specific params
 */
export type TCreatePriorityFilterParams = TCreateFilterConfigParams & IFilterIconConfig<TIssuePriorities>;

/**
 * Helper to get the priority multi select config
 * @param params - The filter params
 * @returns The priority multi select config
 */
export const getPriorityMultiSelectConfig = (params: TCreatePriorityFilterParams) =>
  getMultiSelectConfig<{ key: TIssuePriorities; title: string }, TIssuePriorities, TIssuePriorities>(
    {
      items: ISSUE_PRIORITIES,
      getId: (priority) => priority.key,
      getLabel: (priority) => priority.title,
      getValue: (priority) => priority.key,
      getIconData: (priority) => priority.key,
    },
    {
      singleValueOperator: EQUALITY_OPERATOR.EXACT,
      operatorLabel: params.operatorLabel,
    },
    {
      getOptionIcon: params.getOptionIcon,
    }
  );

/**
 * Get the priority filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the priority filter config
 */
export const getPriorityFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreatePriorityFilterParams> =>
  (params: TCreatePriorityFilterParams) =>
    createFilterConfig<P, TIssuePriorities>({
      id: key,
      label: "Priority",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([[COLLECTION_OPERATOR.IN, getPriorityMultiSelectConfig(params)]]),
    });
