import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
import { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

export const useInboxIssues = (inboxIssueId: string): IInboxIssueStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInboxIssues must be used within StoreProvider");
  return context.projectInbox.getIssueInboxByIssueId(inboxIssueId) || ({} as IInboxIssueStore);
};
