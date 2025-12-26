// plane imports
import type { TIssuePriorities } from "@plane/constants";
import { ISSUE_PRIORITIES } from "@plane/constants";
import type { TFilterProperty, TSupportedOperators } from "@plane/types";
import { EQUALITY_OPERATOR, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import type { TCreateFilterConfigParams, IFilterIconConfig, TCreateFilterConfig } from "../../../rich-filters";
import { createFilterConfig, getMultiSelectConfig, createOperatorConfigEntry } from "../../../rich-filters";

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
export const getPriorityMultiSelectConfig = (
  params: TCreatePriorityFilterParams,
  singleValueOperator: TSupportedOperators
) =>
  getMultiSelectConfig<{ key: TIssuePriorities; title: string }, TIssuePriorities, TIssuePriorities>(
    {
      items: ISSUE_PRIORITIES,
      getId: (priority) => priority.key,
      getLabel: (priority) => priority.title,
      getValue: (priority) => priority.key,
      getIconData: (priority) => priority.key,
    },
    {
      singleValueOperator,
      ...params,
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
    createFilterConfig<P>({
      id: key,
      label: "Priority",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getPriorityMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
