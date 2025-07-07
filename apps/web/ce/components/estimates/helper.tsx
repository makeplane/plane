import { TEstimateSystemKeys, EEstimateSystem } from "@plane/types";

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
