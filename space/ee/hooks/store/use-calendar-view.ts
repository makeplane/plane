import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-provider";
import { ICalendarStore } from "@/plane-web/store/issue_calendar_view.store";

export const useCalendarView = (): ICalendarStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useLabel must be used within StoreProvider");
  return context.calendarStore;
};
