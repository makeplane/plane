import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";

export const useMultipleSelectStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMultipleSelectStore must be used within StoreProvider");
  return context.multipleSelect;
};
