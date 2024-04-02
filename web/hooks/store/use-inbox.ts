import { useContext } from "react";
// mobx store
import { StoreContext } from "@/contexts/store-context";
// types
import { IInboxIssueStore } from "@/store/inbox-issue.store";

export const useInbox = (): IInboxIssueStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInbox must be used within StoreProvider");
  return (context.projectInbox?.inboxIssues || {}).values;
};
