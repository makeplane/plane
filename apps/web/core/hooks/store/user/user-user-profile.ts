import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IUserProfileStore } from "@/store/user/profile.store";

export const useUserProfile = (): IUserProfileStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserProfile must be used within StoreProvider");
  return context.user.userProfile;
};
