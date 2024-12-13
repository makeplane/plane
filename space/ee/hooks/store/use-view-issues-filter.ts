import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
import { IViewIssueFilterStore } from "@/plane-web/store/views/view-issue-filters.store";

export const useViewIssuesFilter = (): IViewIssueFilterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useViewIssues must be used within StoreProvider");
  return context.viewIssuesFilter;
};
