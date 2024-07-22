import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import { IIssueModuleStore } from "@/store/module.store";

export const useModule = (): IIssueModuleStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useModule must be used within StoreProvider");
  return context.module;
};
