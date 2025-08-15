import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IProjectPublishStore } from "@/store/project/project-publish.store";

export const useProjectPublish = (): IProjectPublishStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectPublish must be used within StoreProvider");
  return context.projectRoot.publish;
};
