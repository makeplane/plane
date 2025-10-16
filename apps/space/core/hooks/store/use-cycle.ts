import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import type { ICycleStore } from "@/store/cycle.store";

export const useCycle = (): ICycleStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCycle must be used within StoreProvider");
  return context.cycle;
};
