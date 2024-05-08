import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import { RootStore } from "@/store/root.store";

export const useMobxStore = (): RootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within StoreProvider");
  return context;
};
