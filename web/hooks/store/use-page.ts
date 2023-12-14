import { useContext } from "react";
// mobx store
import { MobxStoreContext } from "lib/mobx/store-provider";
// types
import { IPageStore } from "store/page.store";

export const usePage = (): IPageStore => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
  return context.page;
};
