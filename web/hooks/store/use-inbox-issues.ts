import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";

export const useInboxIssues = (inboxIssueId: string) => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInboxIssues must be used within StoreProvider");
  return context.projectInbox.getIssueInboxByIssueId(inboxIssueId) || {};
};
