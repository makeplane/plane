import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IGitlabStore, IGitlabEnterpriseStore } from "@/plane-web/store/integrations";

export const useGitlabIntegration = (isEnterprise: boolean = false): IGitlabStore | IGitlabEnterpriseStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useGitlabIntegration must be used within StoreProvider");

  return isEnterprise ? context.gitlabEnterpriseIntegration : context.gitlabIntegration;
};
