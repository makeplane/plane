import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITeamPageStore } from "@/plane-web/store/team/pages/team-page.store";

export const useTeamPages = (): ITeamPageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamPages must be used within StoreProvider");
  return context.teamRoot.teamPage;
};
