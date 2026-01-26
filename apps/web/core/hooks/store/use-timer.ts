import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { ITimerStore } from "@/store/timer.store";

export const useTimer = (): ITimerStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTimer must be used within StoreProvider");
  return context.timer;
};
