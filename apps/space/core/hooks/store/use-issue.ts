import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import type { IIssueStore } from "@/store/issue.store";

export const useIssue = (): IIssueStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssue must be used within StoreProvider");
  return context.issue;
};
