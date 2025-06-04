import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IAnalyticsStoreV2 } from "@/plane-web/store/analytics-v2.store";

export const useAnalyticsV2 = (): IAnalyticsStoreV2 => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAnalyticsV2 must be used within StoreProvider");
  return context.analyticsV2;
};
