// plane imports
import { TFilterProperty } from "@plane/types";
// local imports
import { createFilterConfig, TCreateDateFilterParams, TCreateFilterConfig } from "../shared";
import { getSupportedDateOperators, TCustomPropertyFilterParams } from "./shared";

/**
 * Date property filter specific params
 */
export type TCreateDatePropertyFilterParams = TCustomPropertyFilterParams<Date> & TCreateDateFilterParams;

/**
 * Get the date property filter config
 * @param params - The filter params
 * @returns The date property filter config
 */
export const getDatePropertyFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateDatePropertyFilterParams> =>
  (params: TCreateDatePropertyFilterParams) =>
    createFilterConfig({
      id: key,
      ...params,
      label: params.propertyDisplayName,
      icon: params.filterIcon,
      allowMultipleFilters: true,
      supportedOperatorConfigsMap: getSupportedDateOperators(params),
    });
