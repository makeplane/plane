import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamspacePageStore } from "@/plane-web/store/teamspace/pages/teamspace-page.store";

export const useTeamspacePages = (): ITeamspacePageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamspacePages must be used within StoreProvider");
  return context.teamspaceRoot.teamspacePage;
};
