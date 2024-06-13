import { createContext, useContext } from "react";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "./store";

export const IssuesStoreContext = createContext<EIssuesStoreType>(EIssuesStoreType.PROJECT);

export const useIssueStoreType = () => {
  const storeType = useContext(IssuesStoreContext);

  return storeType;
};

export const useIssuesStore = () => {
  const storeType = useContext(IssuesStoreContext);

  return useIssues(storeType);
};
