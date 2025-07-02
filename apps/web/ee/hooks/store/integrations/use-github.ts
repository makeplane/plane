import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IGithubStore, IGithubEnterpriseStore } from "@/plane-web/store/integrations";

export const useGithubIntegration = (isEnterprise: boolean = false): IGithubStore | IGithubEnterpriseStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useGithubIntegration must be used within StoreProvider");

  return isEnterprise ? context.githubEnterpriseIntegration : context.githubIntegration;
};
