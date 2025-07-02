import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IProjectUpdateStore } from "@/plane-web/store/projects/project-details/updates.store";

export const useProjectUpdates = (): IProjectUpdateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectFilter must be used within StoreProvider");
  return context.projectDetails.updatesStore;
};
