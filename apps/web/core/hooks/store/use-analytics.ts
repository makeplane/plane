import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IAnalyticsStore } from "@/plane-web/store/analytics.store";

export const useAnalytics = (): IAnalyticsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAnalytics must be used within StoreProvider");
  return context.analytics;
};
