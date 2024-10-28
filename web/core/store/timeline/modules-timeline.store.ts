import { autorun } from "mobx";
// Store
import { CoreRootStore } from "@/store/root.store";
import { BaseTimeLineStore, IBaseTimelineStore } from "ce/store/timeline/base-timeline.store";

export interface IModulesTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class ModulesTimeLineStore extends BaseTimeLineStore implements IModulesTimeLineStore {
  isDependencyEnabled = false;

  constructor(_rootStore: CoreRootStore) {
    super(_rootStore);

    autorun((reaction) => {
      reaction.trace();
      const getModuleById = this.rootStore.module.getModuleById;
      this.updateBlocks(getModuleById);
    });
  }
}
