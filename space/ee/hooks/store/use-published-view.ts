import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-provider";
// stores
import { IProjectViewStore } from "@/plane-web/store/views/project-view.store";

export const useView = (): IProjectViewStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePagesList must be used within StoreProvider");
  return context.projectViewStore;
};
