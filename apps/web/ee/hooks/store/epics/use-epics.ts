import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web imports
import { IEpicBaseStore } from "@/plane-web/store/issue/epic/base.store";

export const useEpics = (): IEpicBaseStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useEpics must be used within StoreProvider");

  return context.epicBaseStore;
};
