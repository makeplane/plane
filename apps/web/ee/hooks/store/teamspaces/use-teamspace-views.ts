import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamspaceViewStore } from "@/plane-web/store/teamspace/teamspace-view.store";

export const useTeamspaceViews = (): ITeamspaceViewStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamspaceViews must be used within StoreProvider");
  return context.teamspaceRoot.teamspaceView;
};
