import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { ITransientStore } from "@/store/transient.store";

export const useTransientSettings = (): ITransientStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTransientSettings must be used within StoreProvider");
  return context.transient;
};
