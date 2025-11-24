import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IPowerKStore } from "@/plane-web/store/power-k.store";

export const usePowerK = (): IPowerKStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePowerK must be used within StoreProvider");
  return context.powerK;
};
