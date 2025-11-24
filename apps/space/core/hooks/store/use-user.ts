import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import type { IUserStore } from "@/store/user.store";

export const useUser = (): IUserStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUser must be used within StoreProvider");
  return context.user;
};
