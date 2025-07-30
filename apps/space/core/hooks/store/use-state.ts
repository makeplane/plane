import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import { IStateStore } from "@/store/state.store";

export const useStates = (): IStateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useState must be used within StoreProvider");
  return context.state;
};
