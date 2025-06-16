import { E_FEATURE_FLAGS } from "@plane/constants";
import { TEstimateSystemKeys } from "@plane/types";
import { EEstimateSystem } from "@plane/types/src/enums";
import { store } from "@/lib/store-context";

export const isEstimateSystemEnabled = (key: TEstimateSystemKeys) => {
  const isTimeEnabled = store.featureFlags.getFeatureFlagForCurrentWorkspace(E_FEATURE_FLAGS.TIME_ESTIMATES, false);

  switch (key) {
    case EEstimateSystem.POINTS:
      return true;
    case EEstimateSystem.CATEGORIES:
      return true;
    case EEstimateSystem.TIME:
      return isTimeEnabled;
    default:
      return false;
  }
};
