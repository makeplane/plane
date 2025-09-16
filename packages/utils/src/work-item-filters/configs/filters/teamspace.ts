// plane imports
import { EQUALITY_OPERATOR, TFilterProperty, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import { createFilterConfig, TCreateFilterConfig } from "../../../rich-filters";
import { getProjectMultiSelectConfig, TCreateProjectFilterParams } from "./shared";

/**
 * Teamspace Project filter specific params
 */
export type TCreateTeamspaceProjectFilterParams = TCreateProjectFilterParams;

/**
 * Get the teamspace project filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the teamspace project filter config
 */
export const getTeamspaceProjectFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateTeamspaceProjectFilterParams> =>
  (params: TCreateTeamspaceProjectFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Teamspace Projects",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        [COLLECTION_OPERATOR.IN, getProjectMultiSelectConfig(params, EQUALITY_OPERATOR.EXACT)],
      ]),
    });
