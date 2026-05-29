import { useContext } from "react";
// store
import { StoreContext } from "@/providers/store.provider";
import type { IInstanceStore } from "@/store/instance.store";

export const useInstance = (): IInstanceStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInstance must be used within StoreProvider");
  return context.instance;
};
