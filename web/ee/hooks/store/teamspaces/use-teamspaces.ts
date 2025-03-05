import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamspaceStore } from "@/plane-web/store/teamspace/teamspace.store";

export const useTeamspaces = (): ITeamspaceStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamspaces must be used within StoreProvider");
  return context.teamspaceRoot.teamspaces;
};