import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { EIssuesStoreType } from "constants/issue";

export const useIssues = (storeType?: EIssuesStoreType) => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssues must be used within StoreProvider");
  switch (storeType) {
    case EIssuesStoreType.PROJECT:
      return {
        issues: context.issue.projectIssues,
        issuesFilter: context.issue.projectIssuesFilter,
        issueMap: context.issue.issues,
      };
    default:
      return { issueMap: context.issue.issues };
  }
};
