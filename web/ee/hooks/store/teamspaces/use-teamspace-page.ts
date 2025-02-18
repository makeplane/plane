import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { TTeamspacePage } from "@/plane-web/store/teamspace/pages/teamspace-page";

export const useTeamspacePage = (teamspaceId: string, pageId: string | undefined): TTeamspacePage => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTeamspacePage must be used within StoreProvider");
  if (!pageId) return {} as TTeamspacePage;

  return context.teamspaceRoot.teamspacePage.getPageById(teamspaceId, pageId) ?? ({} as TTeamspacePage);
};
