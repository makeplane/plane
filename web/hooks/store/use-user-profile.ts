import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IProfileStore } from "store/user/profile.store";

export const useUserProfile = (): IProfileStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUser must be used within StoreProvider");
  return context.user.profile;
};
