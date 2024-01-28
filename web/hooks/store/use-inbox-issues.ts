import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IInboxIssue } from "store/inbox/inbox_issue.store";
import { IInboxFilter } from "store/inbox/inbox_filter.store";

export const useInboxIssues = (): {
  issues: IInboxIssue;
  filters: IInboxFilter;
} => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInboxIssues must be used within StoreProvider");
  return { issues: context.inbox.inboxIssue, filters: context.inbox.inboxFilter };
};
