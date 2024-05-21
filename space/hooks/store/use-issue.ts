import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import { IIssueStore } from "@/store/issue.store";

export const useIssue = (): IIssueStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserProfile must be used within StoreProvider");
  return context.issue;
};
