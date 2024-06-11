import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IEventTrackerStore } from "@/store/event-tracker.store";

export const useEventTracker = (): IEventTrackerStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useEventTracker must be used within StoreProvider");
  return context.eventTracker;
};
