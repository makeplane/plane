import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web imports
import { IEpicAnalyticStore } from "@/plane-web/store/issue/epic/analytic.store";

export const useEpicAnalytics = (): IEpicAnalyticStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useEpicAnalytics must be used within StoreProvider");

  return context.epicAnalytics;
};
