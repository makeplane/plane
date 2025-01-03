import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamCycleStore } from "@/plane-web/store/team/team-cycle.store";

export const useTeamCycles = (): ITeamCycleStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamCycles must be used within StoreProvider");
  return context.teamRoot.teamCycle;
};
