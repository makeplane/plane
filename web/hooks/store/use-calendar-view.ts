import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { ICalendarStore } from "store/issue/issue_calendar_view.store";

export const useCalendarView = (): ICalendarStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useLabel must be used within StoreProvider");
  return context.issue.issueCalendarView;
};
