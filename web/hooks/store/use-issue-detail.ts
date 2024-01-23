import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IIssueDetail } from "store/issue/issue-details/root.store";

export const useIssueDetail = (): IIssueDetail => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInbox must be used within StoreProvider");
  return context.issue.issueDetail;
};
