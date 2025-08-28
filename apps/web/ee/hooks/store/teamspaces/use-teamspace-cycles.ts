import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamspaceCycleStore } from "@/plane-web/store/teamspace/teamspace-cycle.store";

export const useTeamspaceCycles = (): ITeamspaceCycleStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamspaceCycles must be used within StoreProvider");
  return context.teamspaceRoot.teamspaceCycle;
};
