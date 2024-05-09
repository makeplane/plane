import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import { IProfileStore } from "@/store/user/profile.store";

export const useUserProfile = (): IProfileStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserProfile must be used within StoreProvider");
  return context.profile;
};
