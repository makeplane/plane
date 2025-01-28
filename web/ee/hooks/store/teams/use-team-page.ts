import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { TTeamPage } from "@/plane-web/store/team/pages/team-page";

export const useTeamPage = (teamId: string, pageId: string | undefined): TTeamPage => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");
  if (!pageId) return {} as TTeamPage;

  return context.teamRoot.teamPage.getPageById(teamId, pageId) ?? ({} as TTeamPage);
};
