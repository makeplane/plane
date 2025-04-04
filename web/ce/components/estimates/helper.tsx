import { TEstimateSystemKeys } from "@plane/types";
import { EEstimateSystem } from "@plane/types/src/enums";

export const isEstimateSystemEnabled = (key: TEstimateSystemKeys) => {
  switch (key) {
    case EEstimateSystem.POINTS:
      return true;
    case EEstimateSystem.CATEGORIES:
      return true;
    default:
      return false;
  }
};
