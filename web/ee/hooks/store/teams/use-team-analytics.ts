import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamAnalyticsStore } from "@/plane-web/store/team/team-analytics.store";

export const useTeamAnalytics = (): ITeamAnalyticsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamAnalytics must be used within StoreProvider");
  return context.teamRoot.teamAnalytics;
};
