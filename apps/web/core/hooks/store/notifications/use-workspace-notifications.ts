import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import type { IWorkspaceNotificationStore } from "@/store/notifications/workspace-notifications.store";

export const useWorkspaceNotifications = (): IWorkspaceNotificationStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceNotifications must be used within StoreProvider");

  return context.workspaceNotification;
};
