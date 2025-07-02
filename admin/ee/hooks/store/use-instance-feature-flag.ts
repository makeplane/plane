import { useContext } from "react";
// context
import { StoreContext } from "@/app/(all)/store.provider";
// plane admin stores
import { IInstanceFeatureFlagsStore } from "@/plane-admin/store/instance-feature-flags.store";

export const useInstanceFeatureFlags = (): IInstanceFeatureFlagsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInstanceFeatureFlags must be used within StoreProvider");
  return context.instanceFeatureFlags;
};
