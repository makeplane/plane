import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IChangeManagementStore } from "@/store/change-management.store";

export const useChangeManagement = (): IChangeManagementStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useChangeManagement must be used within StoreProvider");
  return context.changeManagement;
};
