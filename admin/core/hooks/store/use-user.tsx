import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-provider";
import { IUserStore } from "@/store/user.store";

export const useUser = (): IUserStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUser must be used within StoreProvider");
  return context.user;
};
