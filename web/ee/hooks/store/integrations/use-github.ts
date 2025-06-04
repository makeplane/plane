import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IGithubStore } from "@/plane-web/store/integrations";

export const useGithubIntegration = (): IGithubStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useGithubIntegration must be used within StoreProvider");

  return context.githubIntegration;
};
