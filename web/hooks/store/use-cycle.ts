import { useContext } from "react";
// mobx store
import { MobxStoreContext } from "lib/mobx/store-provider";
// types
import { ICycleStore } from "store/cycle.store";

export const useCycle = (): ICycleStore => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
  return context.cycle;
};
