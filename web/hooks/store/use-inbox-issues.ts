import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IInboxIssuesStore } from "store/inbox/inbox_issue.store";

export const useInboxIssues = (): IInboxIssuesStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInboxIssues must be used within StoreProvider");
  return context.inboxRoot.inboxIssues;
};
