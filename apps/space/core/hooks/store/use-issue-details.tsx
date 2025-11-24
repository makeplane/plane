import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import type { IIssueDetailStore } from "@/store/issue-detail.store";

export const useIssueDetails = (): IIssueDetailStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserProfile must be used within StoreProvider");
  return context.issueDetail;
};
