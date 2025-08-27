import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IAutomationsRootStore } from "@/plane-web/store/automations/root.store";

export const useAutomations = (): IAutomationsRootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAutomations must be used within StoreProvider");
  return context.automationsRoot;
};
