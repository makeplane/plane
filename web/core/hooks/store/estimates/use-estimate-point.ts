import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IEstimatePoint } from "@/store/estimates/estimate-point";

export const useEstimatePoint = (
  estimateId: string | undefined,
  estimatePointId: string | undefined
): IEstimatePoint => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useEstimatePoint must be used within StoreProvider");
  if (!estimateId || !estimatePointId) return {} as IEstimatePoint;

  return context.projectEstimate.estimates?.[estimateId]?.estimatePoints?.[estimatePointId] || {};
};
