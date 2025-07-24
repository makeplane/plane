import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import { IIssueLabelStore } from "@/store/label.store";

export const useLabel = (): IIssueLabelStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useLabel must be used within StoreProvider");
  return context.label;
};
