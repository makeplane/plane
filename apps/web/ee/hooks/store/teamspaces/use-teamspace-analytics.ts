import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamspaceAnalyticsStore } from "@/plane-web/store/teamspace/teamspace-analytics.store";

export const useTeamspaceAnalytics = (): ITeamspaceAnalyticsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamspaceAnalytics must be used within StoreProvider");
  return context.teamspaceRoot.teamspaceAnalytics;
};
