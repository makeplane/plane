import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
import { IViewIssueStore } from "@/plane-web/store/views/view-issues.store";

export const useViewIssues = (): IViewIssueStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useViewIssues must be used within StoreProvider");
  return context.viewIssues;
};
