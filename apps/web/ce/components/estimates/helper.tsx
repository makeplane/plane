import type { TEstimateSystemKeys } from "@plane/types";
import { EEstimateSystem } from "@plane/types";

export const isEstimateSystemEnabled = (key: TEstimateSystemKeys) => {
  // All estimate systems enabled
  return true;
};
