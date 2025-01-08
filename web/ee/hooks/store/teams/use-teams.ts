import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamStore } from "@/plane-web/store/team/team.store";

export const useTeams = (): ITeamStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeams must be used within StoreProvider");
  return context.teamRoot.team;
};
