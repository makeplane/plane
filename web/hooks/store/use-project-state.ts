import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IStateStore } from "store/state.store";

export const useProjectState = (): IStateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectState must be used within StoreProvider");
  return context.state;
};
