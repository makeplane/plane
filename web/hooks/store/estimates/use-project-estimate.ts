import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IProjectEstimateStore } from "@/store/estimates/project-estimate.store";

export const useProjectEstimates = (): IProjectEstimateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectPage must be used within StoreProvider");

  return context.projectEstimate;
};
