import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import { IProfileStore } from "@/store/profile.store";

export const useUserProfile = (): IProfileStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserProfile must be used within StoreProvider");
  return context.user.profile;
};
