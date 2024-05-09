import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IIssueKanBanViewStore } from "@/store/issue/issue_kanban_view.store";

export const useKanbanView = (): IIssueKanBanViewStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useLabel must be used within StoreProvider");
  return context.issue.issueKanBanView;
};
