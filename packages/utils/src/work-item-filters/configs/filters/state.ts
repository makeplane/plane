// plane imports
import { STATE_GROUPS } from "@plane/constants";
import {
  COLLECTION_OPERATOR,
  EQUALITY_OPERATOR,
  IState,
  TFilterProperty,
  TStateGroups,
  TSupportedOperators,
} from "@plane/types";
// local imports
import {
  createFilterConfig,
  getMultiSelectConfig,
  IFilterIconConfig,
  TCreateFilterConfig,
  TCreateFilterConfigParams,
  createOperatorConfigEntry,
} from "../../../rich-filters";

// ------------ State group filter ------------

/**
 * State group filter specific params
 */
export type TCreateStateGroupFilterParams = TCreateFilterConfigParams & IFilterIconConfig<TStateGroups>;

/**
 * Helper to get the state group multi select config
 * @param params - The filter params
 * @returns The state group multi select config
 */
export const getStateGroupMultiSelectConfig = (
  params: TCreateStateGroupFilterParams,
  singleValueOperator: TSupportedOperators
) =>
  getMultiSelectConfig<{ key: TStateGroups; label: string }, TStateGroups, TStateGroups>(
    {
      items: Object.values(STATE_GROUPS),
      getId: (state) => state.key,
      getLabel: (state) => state.label,
      getValue: (state) => state.key,
      getIconData: (state) => state.key,
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
 * Get the state group filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the state group filter config
 */
export const getStateGroupFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateStateGroupFilterParams> =>
  (params: TCreateStateGroupFilterParams) =>
    createFilterConfig<P, TStateGroups>({
      id: key,
      label: "State Group",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getStateGroupMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });

// ------------ State filter ------------

/**
 * State filter specific params
 */
export type TCreateStateFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<IState> & {
    states: IState[];
  };

/**
 * Helper to get the state multi select config
 * @param params - The filter params
 * @returns The state multi select config
 */
export const getStateMultiSelectConfig = (params: TCreateStateFilterParams) =>
  getMultiSelectConfig<IState, string, IState>(
    {
      items: params.states,
      getId: (state) => state.id,
      getLabel: (state) => state.name,
      getValue: (state) => state.id,
      getIconData: (state) => state,
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
 * Get the state filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the state filter config
 */
export const getStateFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateStateFilterParams> =>
  (params: TCreateStateFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "State",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getStateMultiSelectConfig(updatedParams)
        ),
      ]),
    });
