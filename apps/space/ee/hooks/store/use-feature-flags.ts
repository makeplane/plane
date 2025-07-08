import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-provider";
// stores
import { IFeatureFlagsStore } from "@/plane-web/store/feature_flags.store";

export const useFeatureFlags = (): IFeatureFlagsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFeatureFlags must be used within StoreProvider");
  return context.featureFlagsStore;
};
