// plane imports
import { EQUALITY_OPERATOR, TFilterProperty, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import {
  createFilterConfig,
  TCreateFilterConfig,
} from "../../../rich-filters";
import { getProjectMultiSelectConfig, TCreateProjectFilterParams } from "./shared";

// ------------ Project filter ------------

/**
 * Get the project filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the project filter config
 */
export const getProjectFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateProjectFilterParams> =>
  (params: TCreateProjectFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Projects",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        [COLLECTION_OPERATOR.IN, getProjectMultiSelectConfig(params, EQUALITY_OPERATOR.EXACT)],
      ]),
    });
