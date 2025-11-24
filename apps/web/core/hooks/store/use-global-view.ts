import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IGlobalViewStore } from "@/plane-web/store/global-view.store";

export const useGlobalView = (): IGlobalViewStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useGlobalView must be used within StoreProvider");
  return context.globalView;
};
