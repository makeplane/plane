// plane imports
import { STATE_GROUPS } from "@plane/constants";
import type { IState, TFilterProperty, TStateGroups, TSupportedOperators } from "@plane/types";
import { COLLECTION_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";
// local imports
import type { IFilterIconConfig, TCreateFilterConfig, TCreateFilterConfigParams } from "../../../rich-filters";
import { createFilterConfig, getMultiSelectConfig, createOperatorConfigEntry } from "../../../rich-filters";

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
    createFilterConfig<P>({
      id: key,
      label: "State Group",
      ...params,
      icon: params.filterIcon,
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
export const getStateMultiSelectConfig = (params: TCreateStateFilterParams, singleValueOperator: TSupportedOperators) =>
  getMultiSelectConfig<IState, string, IState>(
    {
      items: params.states,
      getId: (state) => state.id,
      getLabel: (state) => state.name,
      getValue: (state) => state.id,
      getIconData: (state) => state,
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
 * Get the state filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the state filter config
 */
export const getStateFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateStateFilterParams> =>
  (params: TCreateStateFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "State",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getStateMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
