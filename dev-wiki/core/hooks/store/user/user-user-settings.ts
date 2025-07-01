import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IUserSettingsStore } from "@/store/user/settings.store";

export const useUserSettings = (): IUserSettingsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserSettings must be used within StoreProvider");
  return context.user.userSettings;
};
