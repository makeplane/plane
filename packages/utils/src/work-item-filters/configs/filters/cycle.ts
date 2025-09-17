// plane imports
import { EQUALITY_OPERATOR, ICycle, TCycleGroups, TFilterProperty, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import {
  createFilterConfig,
  TCreateFilterConfigParams,
  IFilterIconConfig,
  TCreateFilterConfig,
  getMultiSelectConfig,
} from "../../../rich-filters";

/**
 * Cycle filter specific params
 */
export type TCreateCycleFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<TCycleGroups> & {
    cycles: ICycle[];
  };

/**
 * Helper to get the cycle multi select config
 * @param params - The filter params
 * @returns The cycle multi select config
 */
export const getCycleMultiSelectConfig = (params: TCreateCycleFilterParams) =>
  getMultiSelectConfig<ICycle, string, TCycleGroups>(
    {
      items: params.cycles,
      getId: (cycle) => cycle.id,
      getLabel: (cycle) => cycle.name,
      getValue: (cycle) => cycle.id,
      getIconData: (cycle) => cycle.status || "draft",
    },
    {
      singleValueOperator: EQUALITY_OPERATOR.EXACT,
      ...params,
    },
    {
      ...params,
    }
  );

/**
 * Get the cycle filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the cycle filter config
 */
export const getCycleFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateCycleFilterParams> =>
  (params: TCreateCycleFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Cycle",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([[COLLECTION_OPERATOR.IN, getCycleMultiSelectConfig(params)]]),
    });
