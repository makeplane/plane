import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types;
import type { IMemberRootStore } from "@/store/member";

export const useMember = (): IMemberRootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMember must be used within StoreProvider");
  return context.memberRoot;
};
