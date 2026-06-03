import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { RootStore as _RootStore } from "@/plane-web/store/root.store";
import type { IHelpCenterStore } from "@/plane-web/store/help-center/help-center.store";

export const useHelpCenter = (): IHelpCenterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useHelpCenter must be used within StoreProvider");
  return context.helpCenter;
};
