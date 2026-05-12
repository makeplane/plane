import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IProjectFieldPermissionStore } from "@/plane-web/store/project-field-permission.store";

export const useProjectFieldPermission = (): IProjectFieldPermissionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectFieldPermission must be used within StoreProvider");
  return (context as unknown as { projectFieldPermission: IProjectFieldPermissionStore }).projectFieldPermission;
};
