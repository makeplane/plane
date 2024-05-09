import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";

export const useBulkIssueOperations = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBulkIssueOperations must be used within StoreProvider");
  return context.issue.issueBulkOperations;
};
