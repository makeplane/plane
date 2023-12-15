import { useContext } from "react";
// mobx store
import { MobxStoreContext } from "lib/mobx/store-provider";
// types
import { EIssuesStoreType } from "constants/issue";

export const useIssues = (storeType?: EIssuesStoreType) => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
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
