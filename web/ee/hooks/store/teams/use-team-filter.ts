import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamFilterStore } from "@/plane-web/store/team/team-filter.store";

export const useTeamFilter = (): ITeamFilterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamFilter must be used within StoreProvider");
  return context.teamRoot.teamFilter;
};
