// plane imports
import { EQUALITY_OPERATOR, IModule, TFilterProperty, COLLECTION_OPERATOR } from "@plane/types";
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
 * Module filter specific params
 */
export type TCreateModuleFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<undefined> & {
    modules: IModule[];
  };

/**
 * Helper to get the module multi select config
 * @param params - The filter params
 * @returns The module multi select config
 */
export const getModuleMultiSelectConfig = (params: TCreateModuleFilterParams) =>
  getMultiSelectConfig<IModule, string, undefined>(
    {
      items: params.modules,
      getId: (module) => module.id,
      getLabel: (module) => module.name,
      getValue: (module) => module.id,
      getIconData: () => undefined,
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
 * Get the module filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the module filter config
 */
export const getModuleFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateModuleFilterParams> =>
  (params: TCreateModuleFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Module",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getModuleMultiSelectConfig(updatedParams)
        ),
      ]),
    });
