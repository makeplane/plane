import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamspaceFilterStore } from "@/plane-web/store/teamspace/teamspace-filter.store";

export const useTeamspaceFilter = (): ITeamspaceFilterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamspaceFilter must be used within StoreProvider");
  return context.teamspaceRoot.teamspaceFilter;
};
