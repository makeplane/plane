// plane imports
import { TFilterProperty } from "@plane/types";
// local imports
import {
  createFilterConfig,
  TCreateFilterConfig,
  TCreateDateFilterParams,
  getSupportedDateOperators,
} from "../../../rich-filters";

// ------------ Date filters ------------

/**
 * Get the start date filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the start date filter config
 */
export const getStartDateFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateDateFilterParams> =>
  (params: TCreateDateFilterParams) =>
    createFilterConfig<P, Date>({
      id: key,
      label: "Start date",
      ...params,
      icon: params.filterIcon,
      allowMultipleFilters: true,
      supportedOperatorConfigsMap: getSupportedDateOperators(params),
    });

/**
 * Get the target date filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the target date filter config
 */
export const getTargetDateFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateDateFilterParams> =>
  (params: TCreateDateFilterParams) =>
    createFilterConfig<P, Date>({
      id: key,
      label: "Target date",
      ...params,
      icon: params.filterIcon,
      allowMultipleFilters: true,
      supportedOperatorConfigsMap: getSupportedDateOperators(params),
    });
