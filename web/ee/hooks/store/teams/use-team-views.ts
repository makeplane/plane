import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamViewStore } from "@/plane-web/store/team/team-view.store";

export const useTeamViews = (): ITeamViewStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamViews must be used within StoreProvider");
  return context.teamRoot.teamView;
};
