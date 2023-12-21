import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IIssueDetailStore } from "store/issue/issue_detail.store";

export const useIssueDetail = (): IIssueDetailStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInbox must be used within StoreProvider");
  return context.issue.issueDetail;
};
