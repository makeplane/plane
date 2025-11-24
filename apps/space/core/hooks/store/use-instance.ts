import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import type { IInstanceStore } from "@/store/instance.store";

export const useInstance = (): IInstanceStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserProfile must be used within StoreProvider");
  return context.instance;
};
