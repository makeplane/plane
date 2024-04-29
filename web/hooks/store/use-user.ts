import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IUserStore } from "@/store/user";

export const useUser = (): IUserStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUser must be used within StoreProvider");
  return context.user;
};
