import { useContext } from "react";
// mobx store
import { MobxStoreContext } from "lib/mobx/store-provider";
// types
import { IProjectPublishStore } from "store/project/project-publish.store";

export const useProjectPublish = (): IProjectPublishStore => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
  return context.projectRoot.publish;
};
