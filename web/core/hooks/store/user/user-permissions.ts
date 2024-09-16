import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IUserPermissionStore } from "@/store/user/permissions.store";

export const useUserPermissions = (): IUserPermissionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserPermissions must be used within StoreProvider");

  return context.user.permission;
};
