import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IFeatureFlagsStore } from "@/plane-web/store/feature-flags/feature-flags.store";

export const useFeatureFlags = (): IFeatureFlagsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFeatureFlags must be used within StoreProvider");
  return context.featureFlags;
};
