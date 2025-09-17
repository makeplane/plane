// plane imports
import {
  EQUALITY_OPERATOR,
  ICycle,
  TCycleGroups,
  TFilterProperty,
  COLLECTION_OPERATOR,
  TSupportedOperators,
} from "@plane/types";
// local imports
import {
  createFilterConfig,
  TCreateFilterConfigParams,
  IFilterIconConfig,
  TCreateFilterConfig,
  getMultiSelectConfig,
  createOperatorConfigEntry,
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
export const getCycleMultiSelectConfig = (params: TCreateCycleFilterParams, singleValueOperator: TSupportedOperators) =>
  getMultiSelectConfig<ICycle, string, TCycleGroups>(
    {
      items: params.cycles,
      getId: (cycle) => cycle.id,
      getLabel: (cycle) => cycle.name,
      getValue: (cycle) => cycle.id,
      getIconData: (cycle) => cycle.status || "draft",
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
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getCycleMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
