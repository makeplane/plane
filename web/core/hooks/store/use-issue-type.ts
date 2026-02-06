import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";

export const useIssueType = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useIssueType must be used within StoreProvider");
  return context.issueType;
};
