import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamUpdatesStore } from "@/plane-web/store/team/team-updates.store";

export const useTeamUpdates = (): ITeamUpdatesStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamUpdates must be used within StoreProvider");
  return context.teamRoot.teamUpdates;
};
