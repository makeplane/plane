import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamspaceUpdatesStore } from "@/plane-web/store/teamspace/teamspace-updates.store";

export const useTeamspaceUpdates = (): ITeamspaceUpdatesStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamspaceUpdates must be used within StoreProvider");
  return context.teamspaceRoot.teamspaceUpdates;
};
