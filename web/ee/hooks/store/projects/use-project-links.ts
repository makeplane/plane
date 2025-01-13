import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IProjectLinkStore } from "@/plane-web/store/projects/project-details/link.store";

export const useProjectLinks = (): IProjectLinkStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectFilter must be used within StoreProvider");
  return context.projectDetails.linkStore;
};
