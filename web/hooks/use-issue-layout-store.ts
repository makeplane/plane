import { EIssuesStoreType } from "@/constants/issue";
import { createContext, useContext } from "react";

export const IssuesStoreContext = createContext<EIssuesStoreType>(EIssuesStoreType.PROJECT);

export const useIssueStore = () => {
  const storeType = useContext(IssuesStoreContext);

  return storeType;
};
