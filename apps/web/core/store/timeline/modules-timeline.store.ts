import { autorun } from "mobx";
// Store
import type { RootStore } from "@/plane-web/store/root.store";
import { BaseTimeLineStore } from "@/plane-web/store/timeline/base-timeline.store";
import type { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";

export interface IModulesTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class ModulesTimeLineStore extends BaseTimeLineStore implements IModulesTimeLineStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);

    autorun(() => {
      const getModuleById = this.rootStore.module.getModuleById;
      this.updateBlocks(getModuleById);
    });
  }
}
