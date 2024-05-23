import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { ICycleStore } from "@/store/cycle.store";

export const useCycle = (): ICycleStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCycle must be used within StoreProvider");
  return context.cycle;
};
