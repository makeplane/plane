import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IUserSettingsStore } from "@/store/user/user-setting.store";

export const useCurrentUserSettings = (): IUserSettingsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCurrentUserSettings must be used within StoreProvider");
  return context.user.currentUserSettings;
};
