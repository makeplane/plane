import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IProjectEstimateStore } from "@/store/estimates/project-estimate.store";

export const useProjectEstimates = (projectId: string | undefined): IProjectEstimateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectPage must be used within StoreProvider");

  if (!projectId) throw new Error("projectId must be passed as a property");

  return context.projectEstimate;
};
