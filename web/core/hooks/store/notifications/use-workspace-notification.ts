import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IWorkspaceNotificationStore } from "@/store/notifications/workspace-notification.store";

export const useWorkspaceNotification = (): IWorkspaceNotificationStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceNotification must be used within StoreProvider");

  return context.workspaceNotification;
};
