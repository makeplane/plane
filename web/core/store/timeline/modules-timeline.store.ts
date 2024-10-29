import { autorun } from "mobx";
// Store
import { RootStore } from "@/plane-web/store/root.store";
import { BaseTimeLineStore, IBaseTimelineStore } from "ce/store/timeline/base-timeline.store";

export interface IModulesTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class ModulesTimeLineStore extends BaseTimeLineStore implements IModulesTimeLineStore {
  isDependencyEnabled = false;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    autorun((reaction) => {
      reaction.trace();
      const getModuleById = this.rootStore.module.getModuleById;
      this.updateBlocks(getModuleById);
    });
  }
}
