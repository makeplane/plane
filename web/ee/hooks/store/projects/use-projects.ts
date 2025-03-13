import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IProjectStore } from "@/plane-web/store/projects/projects";

export const useProjectAdvanced = (): IProjectStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProject must be used within StoreProvider");
  return context.projectDetails;
};
