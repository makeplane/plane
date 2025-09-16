// plane imports
import { EQUALITY_OPERATOR, TFilterProperty, TIssueType, COLLECTION_OPERATOR, TSupportedOperators } from "@plane/types";
// local imports
import {
  createFilterConfig,
  TCreateFilterConfigParams,
  IFilterIconConfig,
  TCreateFilterConfig,
  getMultiSelectConfig,
} from "../../../rich-filters";

/**
 * Work item type filter specific params
 */
export type TCreateWorkItemTypeFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<TIssueType> & {
    workItemTypes: TIssueType[];
  };

/**
 * Helper to get the work item type multi select config
 * @param params - The filter params
 * @returns The work item type multi select config
 */
export const getWorkItemTypeMultiSelectConfig = (
  params: TCreateWorkItemTypeFilterParams,
  singleValueOperator: TSupportedOperators
) =>
  getMultiSelectConfig<TIssueType, string, TIssueType>(
    {
      items: params.workItemTypes.filter(Boolean).filter((type) => type.id && type.name),
      getId: (type) => type.id!,
      getLabel: (type) => type.name!,
      getValue: (type) => type.id!,
      getIconData: (type) => type,
    },
    {
      singleValueOperator,
      ...params,
    },
    {
      ...params,
    }
  );

/**
 * Get the work item type filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the work item type filter config
 */
export const getWorkItemTypeFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateWorkItemTypeFilterParams> =>
  (params: TCreateWorkItemTypeFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Type",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        [COLLECTION_OPERATOR.IN, getWorkItemTypeMultiSelectConfig(params, EQUALITY_OPERATOR.EXACT)],
      ]),
    });
