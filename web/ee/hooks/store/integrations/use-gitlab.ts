import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IGitlabStore } from "@/plane-web/store/integrations";

export const useGitlabIntegration = (): IGitlabStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useGitlabIntegration must be used within StoreProvider");

  return context.gitlabIntegration;
};
