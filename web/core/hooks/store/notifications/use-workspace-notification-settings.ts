import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IWorkspaceNotificationSettingsStore } from "@/store/notifications/workspace-notification-settings.store";

export const useWorkspaceNotificationSettings = (): IWorkspaceNotificationSettingsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useNotification must be used within StoreProvider");

  return context.workspaceNotificationSettings;
};
