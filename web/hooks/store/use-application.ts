import { useContext } from "react";
// mobx store
import { MobxStoreContext } from "lib/mobx/store-provider";
// types
import { IAppRootStore } from "store/application";

export const useApplication = (): IAppRootStore => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
  return context.app;
};
